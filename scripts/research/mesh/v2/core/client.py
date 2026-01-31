"""
Enhanced PubMed API Client with session management, rate limiting, and caching.
"""
import requests
import time
import os
import json
import logging
import hashlib
from typing import List, Dict, Optional, Set
from xml.etree import ElementTree

logger = logging.getLogger(__name__)

class PubMedClient:
    """
    A robust client for the PubMed E-utilities API.
    """
    BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

    def __init__(self, api_key: Optional[str] = None, cache_dir: Optional[str] = "scripts/research/mesh/v2/cache"):
        self.api_key = api_key or os.getenv("PUBMED_API_KEY")
        self.session = requests.Session()
        self.cache_dir = cache_dir
        if self.cache_dir:
            os.makedirs(self.cache_dir, exist_ok=True)

        # Rate limiting: 3 requests/sec without API key, 10 with it.
        # We'll be conservative and sleep 0.4s or 0.15s.
        self.delay = 0.4 if not self.api_key else 0.15

    def _get_cache_path(self, tool: str, params: Dict) -> str:
        param_str = json.dumps(params, sort_keys=True)
        hash_val = hashlib.md5(param_str.encode()).hexdigest()
        return os.path.join(self.cache_dir, f"{tool}_{hash_val}.json")

    def _fetch(self, tool: str, params: Dict, use_cache: bool = True) -> Dict:
        if self.api_key:
            params["api_key"] = self.api_key

        cache_path = self._get_cache_path(tool, params) if self.cache_dir and use_cache else None

        if cache_path and os.path.exists(cache_path):
            with open(cache_path, 'r') as f:
                return json.load(f)

        url = f"{self.BASE_URL}/{tool}.fcgi"

        # Exponential backoff for 429 errors
        for attempt in range(3):
            try:
                response = self.session.get(url, params=params)
                if response.status_code == 429:
                    wait = (attempt + 1) * 2
                    logger.warning(f"Rate limited. Waiting {wait}s...")
                    time.sleep(wait)
                    continue

                response.raise_for_status()

                # Handle both JSON and XML responses
                if params.get("retmode") == "json":
                    data = response.json()
                else:
                    data = {"content": response.text}

                if cache_path:
                    with open(cache_path, 'w') as f:
                        json.dump(data, f)

                time.sleep(self.delay)
                return data
            except requests.exceptions.RequestException as e:
                logger.error(f"Request failed: {e}")
                if attempt == 2:
                    raise
                time.sleep(1)

        return {}

    def get_publication_count(self, term: str, year: Optional[int] = None) -> int:
        query = f"({term}[MeSH Major Topic])"
        if year:
            query += f" AND ({year}[PDAT])"

        params = {
            "db": "pubmed",
            "term": query,
            "retmode": "json",
            "retmax": 0
        }

        data = self._fetch("esearch", params)
        return int(data.get("esearchresult", {}).get("count", 0))

    def discover_related_terms(self, term: str, max_papers: int = 50) -> Set[str]:
        query = f"({term}[MeSH Major Topic])"
        params = {
            "db": "pubmed",
            "term": query,
            "retmax": max_papers,
            "sort": "pub_date",
            "retmode": "json"
        }

        search_data = self._fetch("esearch", params)
        ids = search_data.get("esearchresult", {}).get("idlist", [])

        if not ids:
            return set()

        fetch_params = {
            "db": "pubmed",
            "id": ",".join(ids),
            "rettype": "medline",
            "retmode": "xml"
        }

        fetch_data = self._fetch("efetch", fetch_params)
        xml_content = fetch_data.get("content", "")

        related_terms = set()
        if xml_content:
            root = ElementTree.fromstring(xml_content)
            for heading in root.iter("DescriptorName"):
                if heading.text and heading.text != term:
                    related_terms.add(heading.text)

        return related_terms

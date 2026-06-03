"""
MeSH Discovery Suite V9 - Core PubMed Client
Consolidated async client with SQLite caching, session pooling, and rate limiting.
"""
import sqlite3
import aiohttp
import asyncio
import time
import os
import json
import logging
import random
import xml.etree.ElementTree as ET
from typing import List, Dict, Optional, Set, Any, Union

logger = logging.getLogger(__name__)

class PubMedClientV9:
    """
    Unified PubMed API Client (v9)
    """
    BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

    def __init__(
        self,
        api_key: Optional[str] = None,
        cache_db: str = "scripts/research/mesh/v9/cache.db",
        email: str = "cito@greenhousemd.org",
        tool: str = "GreenhouseMeshV9"
    ):
        self.api_key = api_key or os.getenv("PUBMED_API_KEY")
        self.cache_db = cache_db
        self.email = email
        self.tool = tool
        self._init_cache()
        self.telemetry = {"requests": 0, "cache_hits": 0, "errors": 0}
        self._session: Optional[aiohttp.ClientSession] = None

    def _init_cache(self):
        os.makedirs(os.path.dirname(self.cache_db), exist_ok=True)
        conn = sqlite3.connect(self.cache_db)
        conn.execute("CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, value TEXT, timestamp REAL)")
        conn.close()

    async def get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession()
        return self._session

    async def close(self):
        if self._session and not self._session.closed:
            await self._session.close()

    async def _fetch(self, endpoint: str, params: Dict, use_cache: bool = True, use_xml: bool = False) -> Any:
        cache_key = f"pubmed_{endpoint}_{json.dumps(params, sort_keys=True)}"

        if use_cache:
            conn = sqlite3.connect(self.cache_db)
            row = conn.execute("SELECT value FROM cache WHERE key = ?", (cache_key,)).fetchone()
            conn.close()
            if row:
                self.telemetry["cache_hits"] += 1
                return json.loads(row[0]) if not use_xml else row[0]

        if self.api_key:
            params["api_key"] = self.api_key

        params["email"] = self.email
        params["tool"] = self.tool

        url = f"{self.BASE_URL}/{endpoint}.fcgi"
        session = await self.get_session()

        for attempt in range(5):
            try:
                # NCBI guidelines: no more than 3 requests/second without a key, 10 with a key.
                # We'll use a conservative delay.
                await asyncio.sleep(0.1 if self.api_key else 0.4)

                async with session.get(url, params=params) as response:
                    if response.status in [429, 503]:
                        wait = (2 ** attempt) + random.random()
                        logger.warning(f"PubMed API {response.status}. Retrying in {wait:.2f}s...")
                        await asyncio.sleep(wait)
                        continue

                    response.raise_for_status()
                    self.telemetry["requests"] += 1

                    if use_xml:
                        data = await response.text()
                    else:
                        data = await response.json()

                    if use_cache:
                        conn = sqlite3.connect(self.cache_db)
                        conn.execute("INSERT OR REPLACE INTO cache (key, value, timestamp) VALUES (?, ?, ?)",
                                     (cache_key, json.dumps(data) if not use_xml else data, time.time()))
                        conn.commit()
                        conn.close()

                    return data
            except Exception as e:
                self.telemetry["errors"] += 1
                logger.error(f"PubMed request failed: {e}")
                if attempt == 4:
                    return {"error": str(e)}
                await asyncio.sleep(1 + random.random())

        return {"error": "Maximum retries exceeded"}

    async def esearch(self, query: str, **kwargs) -> Dict:
        params = {
            "db": "pubmed",
            "term": query,
            "retmode": "json",
            "usehistory": "y"
        }
        params.update(kwargs)
        return await self._fetch("esearch", params)

    async def efetch(self, ids: Optional[List[str]] = None, **kwargs) -> str:
        params = {
            "db": "pubmed",
            "retmode": "xml"
        }
        if ids:
            params["id"] = ",".join(ids)
        params.update(kwargs)
        return await self._fetch("efetch", params, use_xml=True)

    async def get_publication_count(self, term: str, year: Optional[int] = None, year_range: Optional[tuple] = None) -> int:
        query = f"({term}[MeSH Major Topic])"
        if year:
            query += f" AND ({year}[PDAT])"
        elif year_range:
            query += f" AND ({year_range[0]}:{year_range[1]}[PDAT])"

        data = await self.esearch(query, retmax=0)
        return int(data.get("esearchresult", {}).get("count", 0))

    async def discover_related_terms(self, term: str, max_papers: int = 50, noexp: bool = True) -> Set[str]:
        # Enhancement: use 'noexp' if requested for precision
        tag = "MeSH Major Topic:noexp" if noexp else "MeSH Major Topic"
        query = f"({term}[{tag}])"

        search_data = await self.esearch(query, retmax=max_papers)
        ids = search_data.get("esearchresult", {}).get("idlist", [])

        if not ids:
            return set()

        xml_content = await self.efetch(ids=ids)
        related_terms = set()

        if xml_content and not isinstance(xml_content, dict):
            try:
                root = ET.fromstring(xml_content)
                for heading in root.iter("DescriptorName"):
                    if heading.text and heading.text.lower() != term.lower():
                        related_terms.add(heading.text)
            except Exception as e:
                logger.error(f"XML parsing error in discover_related_terms: {e}")

        return related_terms

    async def get_article_abstracts(self, pmids: List[str]) -> List[Dict]:
        if not pmids:
            return []

        xml_data = await self.efetch(ids=pmids)
        if not xml_data or isinstance(xml_data, dict):
            return []

        articles = []
        try:
            root = ET.fromstring(xml_data)
            for article in root.findall(".//PubmedArticle"):
                pmid_el = article.find(".//PMID")
                pmid = pmid_el.text if pmid_el is not None else "Unknown"

                title_el = article.find(".//ArticleTitle")
                title = title_el.text if title_el is not None else "No Title"

                abstract_text = ""
                abstract_el = article.find(".//AbstractText")
                if abstract_el is not None:
                    abstract_text = "".join(abstract_el.itertext())

                authors = []
                for author in article.findall(".//Author"):
                    last_name = author.find("LastName")
                    fore_name = author.find("ForeName")
                    if last_name is not None and fore_name is not None:
                        authors.append(f"{fore_name.text} {last_name.text}")

                articles.append({
                    "pmid": pmid,
                    "title": title,
                    "abstract": abstract_text,
                    "authors": authors
                })
        except Exception as e:
            logger.error(f"Error parsing PubMed XML for abstracts: {e}")

        return articles

    def get_telemetry(self) -> Dict:
        return self.telemetry

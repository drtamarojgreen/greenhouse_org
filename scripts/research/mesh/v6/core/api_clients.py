import asyncio
import aiohttp
import sqlite3
import json
import os
import time
import random
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

class DiscoveryClientV6:
    """
    Async Discovery Client for PubMed, ClinicalTrials.gov, and openFDA.
    Includes caching and exponential backoff retries.
    """
    PUBMED_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
    CLINICAL_TRIALS_BASE_URL = "https://clinicaltrials.gov/api/v2/studies"
    OPENFDA_BASE_URL = "https://api.fda.gov/drug/label.json"

    def __init__(self, cache_db: str = "scripts/research/mesh/v6/cache.db"):
        self.cache_db = cache_db
        self._init_cache()
        self.api_key = os.getenv("PUBMED_API_KEY")

    def _init_cache(self):
        cache_dir = os.path.dirname(self.cache_db)
        if cache_dir:
            os.makedirs(cache_dir, exist_ok=True)
        try:
            conn = sqlite3.connect(self.cache_db)
            conn.execute("CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, value TEXT, timestamp REAL)")
            conn.close()
        except Exception as e:
            logger.error(f"Failed to initialize cache: {e}")

    async def _fetch(self, session: aiohttp.ClientSession, url: str, params: Dict, use_cache: bool = True) -> Dict:
        cache_key = f"{url}_{json.dumps(params, sort_keys=True)}"
        if use_cache:
            try:
                conn = sqlite3.connect(self.cache_db)
                row = conn.execute("SELECT value FROM cache WHERE key = ?", (cache_key,)).fetchone()
                conn.close()
                if row:
                    return json.loads(row[0])
            except Exception as e:
                logger.warning(f"Cache read error: {e}")

        for attempt in range(5):
            try:
                async with session.get(url, params=params, timeout=30) as response:
                    if response.status in [429, 503]:
                        wait = (2 ** attempt) + random.random()
                        logger.warning(f"Rate limited or service unavailable ({response.status}). Waiting {wait:.2f}s...")
                        await asyncio.sleep(wait)
                        continue

                    if response.status == 404:
                         return {"error": "404 Not Found"}

                    response.raise_for_status()
                    data = await response.json()

                    if use_cache:
                        try:
                            conn = sqlite3.connect(self.cache_db)
                            conn.execute("INSERT OR REPLACE INTO cache (key, value, timestamp) VALUES (?, ?, ?)",
                                         (cache_key, json.dumps(data), time.time()))
                            conn.commit()
                            conn.close()
                        except Exception as e:
                            logger.warning(f"Cache write error: {e}")

                    return data
            except Exception as e:
                if attempt == 4:
                    logger.error(f"Failed to fetch {url} after 5 attempts: {e}")
                    return {"error": str(e)}
                wait = (2 ** attempt) + random.random()
                await asyncio.sleep(wait)
        return {}

    async def get_pubmed_data(self, session: aiohttp.ClientSession, node_name: str) -> Dict:
        params = {
            "db": "pubmed",
            "term": f'({node_name}) AND review[pt]',
            "retmode": "json"
        }
        if self.api_key:
            params["api_key"] = self.api_key

        data = await self._fetch(session, f"{self.PUBMED_BASE_URL}/esearch.fcgi", params)
        if "error" in data:
            return data

        count = int(data.get("esearchresult", {}).get("count", 0))
        return {"review_articles_count": count}

    async def get_clinical_trials_data(self, session: aiohttp.ClientSession, node_name: str, max_pages: int = 3) -> Dict:
        """
        Fetches clinical trials data with pagination support.
        """
        all_interventions = []
        next_token = None
        total_count = 0

        for page in range(max_pages):
            params = {"query.term": node_name, "countTotal": "true", "pageSize": 10}
            if next_token:
                params["pageToken"] = next_token

            data = await self._fetch(session, self.CLINICAL_TRIALS_BASE_URL, params)
            if "error" in data:
                if page == 0: return data
                break

            if page == 0:
                total_count = data.get("totalCount", 0)

            for study in data.get("studies", []):
                study_interventions = study.get("protocolSection", {}).get("armsInterventionsModule", {}).get("interventions", [])
                for intervention in study_interventions:
                    if intervention.get("name"):
                        all_interventions.append(intervention.get("name"))

            next_token = data.get("nextPageToken")
            if not next_token:
                break

        return {
            "trials_count": total_count,
            "interventions": list(set(all_interventions))[:10]
        }

    async def get_fda_drugs_data(self, session: aiohttp.ClientSession, node_name: str, limit: int = 50) -> Dict:
        """
        Fetches FDA drug label data with increased limit and basic pagination support via skip.
        """
        search_query = f'description:"{node_name}"+OR+indications_and_usage:"{node_name}"'
        all_drugs = []

        # OpenFDA allows up to 100 per request, we'll do one large request or multiple if needed.
        # For simplicity and to avoid hitting rate limits too hard, we'll do up to 100.
        params = {"search": search_query, "limit": min(limit, 100)}
        data = await self._fetch(session, self.OPENFDA_BASE_URL, params)

        if "error" in data:
            if "404" in data["error"]:
                return {"related_drugs": [], "message": f"No direct drugs found for '{node_name}'."}
            return data

        if "results" in data:
            for result in data["results"]:
                if "openfda" in result and "brand_name" in result["openfda"]:
                    all_drugs.extend(result["openfda"]["brand_name"])

        return {"related_drugs": list(set(all_drugs))}

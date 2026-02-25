"""
MeSH Discovery Suite V4 - Core PubMed Client
Enhanced with async support, SQLite caching, and robust error handling.
"""
import sqlite3
import aiohttp
import asyncio
import time
import os
import json
import logging
import random
from typing import List, Dict, Optional, Set

logger = logging.getLogger(__name__)

class PubMedClientV4:
    """
    Advanced PubMed API Client (v4)
    """
    BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

    def __init__(self, api_keys: List[str] = None, cache_db: str = "scripts/research/mesh/v4/cache.db"):
        self.api_keys = api_keys or ([os.getenv("PUBMED_API_KEY")] if os.getenv("PUBMED_API_KEY") else [])
        self.cache_db = cache_db
        self._init_cache()
        self.key_index = 0
        self.telemetry = {"requests": 0, "cache_hits": 0, "errors": 0}

    def _init_cache(self):
        os.makedirs(os.path.dirname(self.cache_db), exist_ok=True)
        conn = sqlite3.connect(self.cache_db)
        conn.execute("CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, value TEXT, timestamp REAL)")
        conn.close()

    def _get_api_key(self):
        if not self.api_keys:
            return None
        key = self.api_keys[self.key_index]
        self.key_index = (self.key_index + 1) % len(self.api_keys)
        return key

    async def fetch(self, tool: str, params: Dict, use_cache: bool = True) -> Dict:
        """
        Fetches data from NCBI E-utilities asynchronously.
        """
        cache_key = f"{tool}_{json.dumps(params, sort_keys=True)}"
        if use_cache:
            conn = sqlite3.connect(self.cache_db)
            row = conn.execute("SELECT value FROM cache WHERE key = ?", (cache_key,)).fetchone()
            conn.close()
            if row:
                self.telemetry["cache_hits"] += 1
                return json.loads(row[0])

        api_key = self._get_api_key()
        if api_key:
            params["api_key"] = api_key

        params["email"] = "cito@greenhousemd.org"
        params["tool"] = "GreenhouseMeshV4"

        self.telemetry["requests"] += 1
        url = f"{self.BASE_URL}/{tool}.fcgi"

        async with aiohttp.ClientSession() as session:
            for attempt in range(5):
                try:
                    # Rate limiting mitigation: delay between requests
                    await asyncio.sleep(0.5)
                    async with session.get(url, params=params) as response:
                        if response.status == 429:
                            wait = (2 ** attempt) + random.random()
                            logger.warning(f"Rate limited (429). Retrying in {wait:.2f}s...")
                            await asyncio.sleep(wait)
                            continue

                        if response.status == 503:
                            wait = (2 ** attempt) + random.random()
                            logger.warning(f"Service Unavailable (503). Retrying in {wait:.2f}s...")
                            await asyncio.sleep(wait)
                            continue

                        response.raise_for_status()

                        if params.get("retmode") == "json":
                            data = await response.json()
                        else:
                            data = {"content": await response.text()}

                        if use_cache:
                            conn = sqlite3.connect(self.cache_db)
                            conn.execute("INSERT OR REPLACE INTO cache (key, value, timestamp) VALUES (?, ?, ?)",
                                         (cache_key, json.dumps(data), time.time()))
                            conn.commit()
                            conn.close()

                        return data
                except Exception as e:
                    self.telemetry["errors"] += 1
                    logger.error(f"Request failed: {e}")
                    if attempt == 4:
                        raise
                    await asyncio.sleep(1 + random.random())
        return {}

    async def esearch(self, term: str, use_history: bool = True, **kwargs) -> Dict:
        """
        Performs an esearch.
        """
        params = {
            "db": "pubmed",
            "term": term,
            "usehistory": "y" if use_history else "n",
            "retmode": "json"
        }
        params.update(kwargs)
        return await self.fetch("esearch", params)

    async def efetch(self, ids: List[str] = None, query_key: str = None, web_env: str = None, **kwargs) -> str:
        """
        Performs an efetch.
        """
        params = {
            "db": "pubmed",
            "retmode": "xml"
        }
        if ids:
            params["id"] = ",".join(ids)
        if query_key and web_env:
            params["query_key"] = query_key
            params["WebEnv"] = web_env

        params.update(kwargs)
        data = await self.fetch("efetch", params)
        return data.get("content", "")

    async def get_publication_count(self, term: str, year_range: Optional[tuple] = None) -> int:
        """
        Gets publication count, optionally within a year range.
        """
        query = f"({term}[MeSH Major Topic])"
        if year_range:
            query += f" AND ({year_range[0]}:{year_range[1]}[PDAT])"

        data = await self.esearch(query, use_history=False, retmax=0)
        return int(data.get("esearchresult", {}).get("count", 0))

    def get_telemetry(self):
        return self.telemetry

"""
MeSH Discovery Suite V5 - Core PubMed Client (Temporal Optimized)
Inherits from V4 foundation with focus on time-bucketed performance.
"""
import sqlite3
import aiohttp
import asyncio
import time
import os
import json
import logging
import random
from typing import List, Dict, Optional, Tuple

logger = logging.getLogger(__name__)

class PubMedClientV5:
    """
    Temporal-Optimized PubMed API Client (v5)
    """
    BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

    def __init__(self, api_keys: List[str] = None, cache_db: str = "scripts/research/mesh/v5/cache.db"):
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
        params["tool"] = "GreenhouseMeshV5"

        self.telemetry["requests"] += 1
        url = f"{self.BASE_URL}/{tool}.fcgi"

        async with aiohttp.ClientSession() as session:
            for attempt in range(5):
                try:
                    async with session.get(url, params=params) as response:
                        if response.status == 429:
                            wait = (2 ** attempt) + random.random()
                            await asyncio.sleep(wait)
                            continue

                        if response.status == 503:
                            wait = (2 ** attempt) + random.random()
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
                    if attempt == 4:
                        raise
                    await asyncio.sleep(1 + random.random())
        return {}

    async def get_publication_count_in_range(self, term: str, start_year: int, end_year: int) -> int:
        """
        Fetches the number of publications for a term within a specific date range.
        """
        # Using [MeSH Terms] and [DP] (Date - Publication) for broad longitudinal coverage
        query = f'("{term}"[MeSH Terms]) AND ("{start_year}/01/01"[Date - Publication] : "{end_year}/12/31"[Date - Publication])'
        
        params = {
            "db": "pubmed",
            "term": query,
            "retmode": "json",
            "rettype": "count"
        }
        
        data = await self.fetch("esearch", params)
        count_str = data.get("esearchresult", {}).get("count", "0")
        return int(count_str)

    def get_telemetry(self):
        return self.telemetry

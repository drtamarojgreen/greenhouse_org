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

class NativeAsyncPubMedClient:
    """
    Advanced async PubMed API Client natively ported to v12.
    """
    BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

    def __init__(self, api_keys: List[str] = None, cache_db: str = "scripts/research/mesh/v12/cache_v4.db"):
        self.api_keys = api_keys or ([os.getenv("PUBMED_API_KEY")] if os.getenv("PUBMED_API_KEY") else [])
        self.cache_db = cache_db
        self._init_cache()
        self.key_index = 0

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
                return json.loads(row[0])

        api_key = self._get_api_key()
        if api_key:
            params["api_key"] = api_key

        url = f"{self.BASE_URL}/{tool}.fcgi"

        async with aiohttp.ClientSession() as session:
            for attempt in range(5):
                try:
                    await asyncio.sleep(0.5)
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
                    logger.error(f"Request failed: {e}")
                    if attempt == 4:
                        raise
                    await asyncio.sleep(1 + random.random())
        return {}

    async def esearch(self, term: str, use_history: bool = True, **kwargs) -> Dict:
        params = {"db": "pubmed", "term": term, "usehistory": "y" if use_history else "n", "retmode": "json"}
        params.update(kwargs)
        return await self.fetch("esearch", params)

    async def efetch(self, ids: List[str] = None, **kwargs) -> str:
        params = {"db": "pubmed", "retmode": "xml"}
        if ids: params["id"] = ",".join(ids)
        params.update(kwargs)
        data = await self.fetch("efetch", params)
        return data.get("content", "")

    async def get_publication_count(self, term: str) -> int:
        query = f"({term}[MeSH Major Topic])"
        data = await self.esearch(query, use_history=False, retmax=0)
        return int(data.get("esearchresult", {}).get("count", 0))

import aiohttp
import asyncio
import sqlite3
import json
import os
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

class DisGeNETClient:
    """
    Client for DisGeNET API to fetch gene-disease and disease-drug associations.
    """
    BASE_URL = "https://www.disgenet.org/api/v1"

    def __init__(self, api_key: Optional[str] = None, cache_db: str = "scripts/research/mesh/v8/cache.db"):
        self.api_key = api_key or os.getenv("DISGENET_API_KEY")
        self.cache_db = cache_db
        self._init_cache()

    def _init_cache(self):
        cache_dir = os.path.dirname(self.cache_db)
        if cache_dir:
            os.makedirs(cache_dir, exist_ok=True)
        conn = sqlite3.connect(self.cache_db)
        conn.execute("CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, value TEXT, timestamp REAL)")
        conn.close()

    async def _fetch(self, session: aiohttp.ClientSession, endpoint: str, params: Dict) -> Any:
        cache_key = f"disgenet_{endpoint}_{json.dumps(params, sort_keys=True)}"

        conn = sqlite3.connect(self.cache_db)
        row = conn.execute("SELECT value FROM cache WHERE key = ?", (cache_key,)).fetchone()
        conn.close()
        if row:
            return json.loads(row[0])

        if not self.api_key:
            logger.warning("DisGeNET API key not provided. Returning empty results.")
            return {"error": "No API key"}

        headers = {"Authorization": f"Bearer {self.api_key}"}
        url = f"{self.BASE_URL}/{endpoint}"

        try:
            async with session.get(url, params=params, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    conn = sqlite3.connect(self.cache_db)
                    conn.execute("INSERT OR REPLACE INTO cache (key, value, timestamp) VALUES (?, ?, ?)",
                                 (cache_key, json.dumps(data), asyncio.get_event_loop().time()))
                    conn.commit()
                    conn.close()
                    return data
                else:
                    logger.error(f"DisGeNET API error: {response.status}")
                    return {"error": f"HTTP {response.status}"}
        except Exception as e:
            logger.error(f"DisGeNET connection error: {e}")
            return {"error": str(e)}

    def _get_mock_data(self, disorder: str) -> List[Dict]:
        """
        Returns mock gene-disease associations for testing or fallback.
        Uses generic placeholders to avoid disorder-specific bias.
        """
        return [
            {"gene_symbol": "GENE_A", "gene_name": f"Candidate Gene A for {disorder}", "score": 0.9, "disease_name": disorder},
            {"gene_symbol": "GENE_B", "gene_name": f"Candidate Gene B for {disorder}", "score": 0.8, "disease_name": disorder},
            {"gene_symbol": "GENE_C", "gene_name": f"Candidate Gene C for {disorder}", "score": 0.7, "disease_name": disorder}
        ]

    async def get_associations_for_disorder(self, session: aiohttp.ClientSession, disorder: str) -> List[Dict]:
        """
        Fetches gene-disease associations for a disorder.
        """
        params = {"disease": disorder, "source": "CURATED"}
        data = await self._fetch(session, "gda/disease", params)

        if isinstance(data, dict) and "error" in data:
            if data.get("error") == "No API key":
                logger.info("Using mock data fallback for DisGeNET.")
                return self._get_mock_data(disorder)
            return []

        associations = []
        if isinstance(data, list):
            for item in data:
                associations.append({
                    "gene_symbol": item.get("gene_symbol"),
                    "gene_name": item.get("gene_name"),
                    "score": item.get("score"),
                    "disease_name": item.get("disease_name")
                })
        return associations

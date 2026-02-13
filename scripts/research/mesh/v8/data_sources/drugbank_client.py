import aiohttp
import asyncio
import sqlite3
import json
import os
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

class DrugBankClient:
    """
    Client for DrugBank API to fetch drug-disorder associations.
    """
    BASE_URL = "https://api.drugbank.com/v1"

    def __init__(self, api_key: Optional[str] = None, cache_db: str = "scripts/research/mesh/v8/cache.db"):
        self.api_key = api_key or os.getenv("DRUGBANK_API_KEY")
        self.cache_db = cache_db
        self._init_cache()

    def _init_cache(self):
        cache_dir = os.path.dirname(self.cache_db)
        if cache_dir:
            os.makedirs(cache_dir, exist_ok=True)
        conn = sqlite3.connect(self.cache_db)
        conn.execute("CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, value TEXT, timestamp REAL)")
        conn.close()

    async def _fetch(self, session: aiohttp.ClientSession, endpoint: str, params: Dict) -> Dict:
        cache_key = f"drugbank_{endpoint}_{json.dumps(params, sort_keys=True)}"

        conn = sqlite3.connect(self.cache_db)
        row = conn.execute("SELECT value FROM cache WHERE key = ?", (cache_key,)).fetchone()
        conn.close()
        if row:
            return json.loads(row[0])

        if not self.api_key:
            logger.warning("DrugBank API key not provided. Returning empty results.")
            return {"error": "No API key"}

        headers = {"Authorization": self.api_key}
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
                    logger.error(f"DrugBank API error: {response.status}")
                    return {"error": f"HTTP {response.status}"}
        except Exception as e:
            logger.error(f"DrugBank connection error: {e}")
            return {"error": str(e)}

    async def get_drugs_for_disorder(self, session: aiohttp.ClientSession, disorder: str) -> List[Dict]:
        """
        Fetches drugs associated with a disorder.
        """
        params = {"q": disorder, "type": "indication"}
        data = await self._fetch(session, "indications", params)

        if "error" in data:
            return []

        drugs = []
        for item in data.get("results", []):
            drugs.append({
                "id": item.get("drug", {}).get("drugbank_id"),
                "name": item.get("drug", {}).get("name"),
                "indication": item.get("indication"),
                "status": "approved"
            })
        return drugs

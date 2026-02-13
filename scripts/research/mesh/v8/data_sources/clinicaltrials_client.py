import aiohttp
import asyncio
import sqlite3
import json
import os
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

class ClinicalTrialsClient:
    """
    Client for ClinicalTrials.gov API v2.
    """
    BASE_URL = "https://clinicaltrials.gov/api/v2/studies"

    def __init__(self, cache_db: str = "scripts/research/mesh/v8/cache.db"):
        self.cache_db = cache_db
        self._init_cache()

    def _init_cache(self):
        cache_dir = os.path.dirname(self.cache_db)
        if cache_dir:
            os.makedirs(cache_dir, exist_ok=True)
        conn = sqlite3.connect(self.cache_db)
        conn.execute("CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, value TEXT, timestamp REAL)")
        conn.close()

    async def _fetch(self, session: aiohttp.ClientSession, params: Dict) -> Dict:
        cache_key = f"clinicaltrials_{json.dumps(params, sort_keys=True)}"

        conn = sqlite3.connect(self.cache_db)
        row = conn.execute("SELECT value FROM cache WHERE key = ?", (cache_key,)).fetchone()
        conn.close()
        if row:
            return json.loads(row[0])

        try:
            async with session.get(self.BASE_URL, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    conn = sqlite3.connect(self.cache_db)
                    conn.execute("INSERT OR REPLACE INTO cache (key, value, timestamp) VALUES (?, ?, ?)",
                                 (cache_key, json.dumps(data), asyncio.get_event_loop().time()))
                    conn.commit()
                    conn.close()
                    return data
                else:
                    logger.error(f"ClinicalTrials API error: {response.status}")
                    return {"error": f"HTTP {response.status}"}
        except Exception as e:
            logger.error(f"ClinicalTrials connection error: {e}")
            return {"error": str(e)}

    async def get_trials_for_disorder(self, session: aiohttp.ClientSession, disorder: str) -> List[Dict]:
        """
        Fetches clinical trials for a disorder.
        """
        params = {"query.term": disorder, "pageSize": 10}
        data = await self._fetch(session, params)

        if "error" in data:
            return []

        trials = []
        for study in data.get("studies", []):
            protocol = study.get("protocolSection", {})
            trials.append({
                "nct_id": protocol.get("identificationModule", {}).get("nctId"),
                "title": protocol.get("identificationModule", {}).get("briefTitle"),
                "status": protocol.get("statusModule", {}).get("overallStatus"),
                "interventions": [i.get("name") for i in protocol.get("armsInterventionsModule", {}).get("interventions", [])]
            })
        return trials

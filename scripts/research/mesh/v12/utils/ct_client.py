import aiohttp
import asyncio
import sqlite3
import json
import os
import time
import random
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

class NativeClinicalTrialsClient:
    """
    Natively ported ClinicalTrials.gov API v2 client for v12.
    """
    BASE_URL = "https://clinicaltrials.gov/api/v2/studies"

    def __init__(self, cache_db: str = "scripts/research/mesh/v12/cache_ct.db"):
        self.cache_db = cache_db
        self._init_cache()
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

    async def _fetch(self, params: Dict, use_cache: bool = True) -> Dict:
        cache_key = f"clinicaltrials_{json.dumps(params, sort_keys=True)}"
        if use_cache:
            conn = sqlite3.connect(self.cache_db)
            row = conn.execute("SELECT value FROM cache WHERE key = ?", (cache_key,)).fetchone()
            conn.close()
            if row:
                return json.loads(row[0])

        session = await self.get_session()
        for attempt in range(5):
            try:
                async with session.get(self.BASE_URL, params=params) as response:
                    if response.status in [429, 503]:
                        wait = (2 ** attempt) + random.random()
                        logger.warning(f"ClinicalTrials API {response.status}. Retrying in {wait:.2f}s...")
                        await asyncio.sleep(wait)
                        continue
                    response.raise_for_status()
                    data = await response.json()
                    if use_cache:
                        conn = sqlite3.connect(self.cache_db)
                        conn.execute("INSERT OR REPLACE INTO cache (key, value, timestamp) VALUES (?, ?, ?)",
                                     (cache_key, json.dumps(data), time.time()))
                        conn.commit()
                        conn.close()
                    return data
            except Exception as e:
                logger.error(f"ClinicalTrials request failed: {e}")
                if attempt == 4:
                    return {"error": str(e)}
                await asyncio.sleep(1 + random.random())
        return {"error": "Maximum retries exceeded"}

    async def get_trials(self, query: str, max_pages: int = 5) -> List[Dict]:
        all_trials = []
        next_token = None
        for page in range(max_pages):
            params = {"query.term": query, "pageSize": 50, "countTotal": "true"}
            if next_token:
                params["pageToken"] = next_token
            data = await self._fetch(params)
            if "error" in data:
                break
            for study in data.get("studies", []):
                protocol = study.get("protocolSection", {})
                all_trials.append({
                    "nct_id": protocol.get("identificationModule", {}).get("nctId"),
                    "title": protocol.get("identificationModule", {}).get("briefTitle"),
                    "status": protocol.get("statusModule", {}).get("overallStatus"),
                    "phase": protocol.get("designModule", {}).get("phases", ["Not Provided"]),
                    "interventions": [i.get("name") for i in protocol.get("armsInterventionsModule", {}).get("interventions", [])],
                    "conditions": protocol.get("conditionsModule", {}).get("conditions", []),
                    "start_date": protocol.get("statusModule", {}).get("startDateStruct", {}).get("date")
                })
            next_token = data.get("nextPageToken")
            if not next_token:
                break
        return all_trials

    async def get_trial_phase_distribution(self, disorder: str) -> Dict:
        trials = await self.get_trials(disorder, max_pages=3)
        phases = {"PHASE1": 0, "PHASE2": 0, "PHASE3": 0, "PHASE4": 0, "NA": 0}
        for trial in trials:
            trial_phases = trial.get("phase", [])
            if not trial_phases:
                phases["NA"] += 1
                continue
            for p in trial_phases:
                p_norm = p.upper().replace(" ", "")
                if p_norm in phases:
                    phases[p_norm] += 1
                else:
                    phases["NA"] += 1
        return phases

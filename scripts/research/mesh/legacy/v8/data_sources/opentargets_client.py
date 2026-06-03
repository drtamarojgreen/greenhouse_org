import aiohttp
import asyncio
import sqlite3
import json
import os
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

class OpenTargetsClient:
    """
    Client for OpenTargets GraphQL API to fetch drug targets and disease associations.
    """
    URL = "https://api.platform.opentargets.org/api/v4/graphql"

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

    async def _query(self, session: aiohttp.ClientSession, query: str, variables: Dict) -> Dict:
        cache_key = f"opentargets_{query}_{json.dumps(variables, sort_keys=True)}"

        conn = sqlite3.connect(self.cache_db)
        row = conn.execute("SELECT value FROM cache WHERE key = ?", (cache_key,)).fetchone()
        conn.close()
        if row:
            return json.loads(row[0])

        try:
            async with session.post(self.URL, json={"query": query, "variables": variables}) as response:
                if response.status == 200:
                    data = await response.json()
                    conn = sqlite3.connect(self.cache_db)
                    conn.execute("INSERT OR REPLACE INTO cache (key, value, timestamp) VALUES (?, ?, ?)",
                                 (cache_key, json.dumps(data), asyncio.get_event_loop().time()))
                    conn.commit()
                    conn.close()
                    return data
                else:
                    logger.error(f"OpenTargets API error: {response.status}")
                    return {"error": f"HTTP {response.status}"}
        except Exception as e:
            logger.error(f"OpenTargets connection error: {e}")
            return {"error": str(e)}

    async def get_drugs_for_disease(self, session: aiohttp.ClientSession, disease_id: str) -> List[Dict]:
        """
        Fetches drugs for a disease using its ID (e.g. EFO_0000249).
        """
        query = """
        query DrugsForDisease($efoId: String!) {
          disease(efoId: $efoId) {
            id
            name
            knownDrugs(size: 10) {
              rows {
                drug {
                  id
                  name
                  maximumClinicalTrialPhase
                }
              }
            }
          }
        }
        """
        variables = {"efoId": disease_id}
        data = await self._query(session, query, variables)

        if "error" in data or "data" not in data:
            return []

        results = []
        disease_data = data.get("data", {}).get("disease")
        if disease_data and disease_data.get("knownDrugs"):
            for row in disease_data["knownDrugs"].get("rows", []):
                drug = row.get("drug", {})
                results.append({
                    "id": drug.get("id"),
                    "name": drug.get("name"),
                    "phase": drug.get("maximumClinicalTrialPhase")
                })
        return results

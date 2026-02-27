"""
MeSH Discovery Suite V9 - Discovery Engine
Hierarchical BFS discovery with level-aware significance scoring and checkpointing.
"""
import logging
import json
import os
import asyncio
import sqlite3
import time
from typing import List, Dict, Set, Optional, Any, AsyncGenerator
from .client import PubMedClientV9

logger = logging.getLogger(__name__)

class DiscoveryEngineV9:
    """
    Advanced Discovery Engine for MeSH terms (v9).
    """
    def __init__(self, client: PubMedClientV9, config: Dict):
        self.client = client
        self.config = config.get('discovery', {})
        self.max_levels = self.config.get('max_levels', 3)
        self.level_thresholds = self.config.get('level_thresholds', {1: 15000, 2: 5000, 3: 1000})
        self.max_children = self.config.get('max_children_per_node', 12)
        self.total_max_terms = self.config.get('total_max_terms', 150)
        self.generic_exclusions = set(self.config.get('generic_term_exclusions', [
            "Humans", "Adult", "Male", "Female", "Middle Aged", "Aged", "Child", "Adolescent"
        ]))

        self.checkpoint_db = config.get('cache', {}).get('db_path', "scripts/research/mesh/v9/cache.db")
        self._init_checkpoint_db()

        self.visited = set()
        self.total_terms = 0
        self.telemetry = {
            "levels": {i: {"accepted": 0, "pruned": 0, "skipped": 0} for i in range(1, self.max_levels + 1)}
        }
        self.semaphore = asyncio.Semaphore(config.get('api', {}).get('max_concurrent_requests', 8))

    def _init_checkpoint_db(self):
        os.makedirs(os.path.dirname(self.checkpoint_db), exist_ok=True)
        conn = sqlite3.connect(self.checkpoint_db)
        conn.execute("CREATE TABLE IF NOT EXISTS checkpoints (key TEXT PRIMARY KEY, value TEXT)")
        conn.close()

    def checkpoint(self, level: int, results: List[Dict]):
        conn = sqlite3.connect(self.checkpoint_db)
        conn.execute("INSERT OR REPLACE INTO checkpoints (key, value) VALUES (?, ?)",
                     (f"level_{level}", json.dumps(results)))
        conn.commit()
        conn.close()
        logger.info(f"Checkpoint saved for Level {level}")

    def load_checkpoint(self, level: int) -> Optional[List[Dict]]:
        conn = sqlite3.connect(self.checkpoint_db)
        row = conn.execute("SELECT value FROM checkpoints WHERE key = ?", (f"level_{level}",)).fetchone()
        conn.close()
        return json.loads(row[0]) if row else None

    async def run(self, seed_term: str) -> AsyncGenerator[Dict, None]:
        """
        Runs the discovery process starting from a seed term.
        Yields results incrementally.
        """
        logger.info(f"Starting V9 Discovery for: {seed_term}")
        self.visited = set()
        self.total_terms = 0

        # Level 1 queue
        queue = [(seed_term, 1, None, 1.0)] # term, level, parent_count, parent_significance

        for level in range(1, self.max_levels + 1):
            next_queue = []
            level_results = []

            # Process current level
            tasks = []
            for term, lvl, p_count, p_sig in queue:
                tasks.append(self._process_term(term, lvl, p_count))

            results = await asyncio.gather(*tasks)

            for res in results:
                if not res: continue

                yield res
                level_results.append(res)

                if res.get("status") == "accepted" and level < self.max_levels:
                    # Get related terms for next level
                    related = await self._fetch_related(res["term"])
                    for r_term in list(related)[:self.max_children]:
                        if r_term not in self.visited:
                            next_queue.append((r_term, level + 1, res["count"], 1.0))

            self.checkpoint(level, level_results)
            queue = next_queue
            if not queue or self.total_terms >= self.total_max_terms:
                break

    async def _process_term(self, term: str, level: int, parent_count: Optional[int]) -> Optional[Dict]:
        if term in self.visited:
            self.telemetry["levels"][level]["skipped"] += 1
            return None

        if self.total_terms >= self.total_max_terms:
            return None

        async with self.semaphore:
            count = await self.client.get_publication_count(term)

        threshold = self.level_thresholds.get(level, 0)
        significance = (count / parent_count) if parent_count else 1.0

        # Significance scoring: accept if count > threshold OR (count > 100 AND significance > 0.1)
        is_accepted = count >= threshold or (parent_count and count > 100 and significance > 0.1)

        if is_accepted:
            self.visited.add(term)
            self.total_terms += 1
            self.telemetry["levels"][level]["accepted"] += 1
            return {
                "term": term,
                "count": count,
                "level": level,
                "significance": round(significance, 4),
                "status": "accepted"
            }
        else:
            self.telemetry["levels"][level]["pruned"] += 1
            return {
                "term": term,
                "count": count,
                "level": level,
                "significance": round(significance, 4),
                "status": "pruned"
            }

    async def _fetch_related(self, term: str) -> Set[str]:
        related = await self.client.discover_related_terms(term)
        return {t for t in related if t not in self.generic_exclusions}

    def get_level_summary(self) -> Dict:
        return self.telemetry

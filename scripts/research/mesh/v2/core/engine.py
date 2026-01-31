"""
Modular discovery engine for MeSH terms.
"""
import logging
from collections import deque
from typing import List, Dict, Set, Optional
from .client import PubMedClient

logger = logging.getLogger(__name__)

class DiscoveryEngine:
    def __init__(self, client: PubMedClient, min_count: int = 1000):
        self.client = client
        self.min_count = min_count
        self.visited = set()
        self.results = []

    def run(self, seed_term: str, max_terms: int = 20, target_year: Optional[int] = None):
        logger.info(f"Starting discovery from seed: {seed_term}")
        queue = deque([seed_term])

        while queue and len(self.results) < max_terms:
            current_term = queue.popleft()

            if current_term in self.visited:
                continue

            logger.info(f"Processing term: {current_term}")
            self.visited.add(current_term)

            count = self.client.get_publication_count(current_term, year=target_year)

            if count >= self.min_count:
                logger.info(f"Accepted: {current_term} ({count} publications)")

                related = self.client.discover_related_terms(current_term)

                self.results.append({
                    "term": current_term,
                    "count": count,
                    "related": sorted(list(related))
                })

                for r in related:
                    if r not in self.visited and r not in queue:
                        queue.append(r)
            else:
                logger.info(f"Rejected: {current_term} ({count} < {self.min_count})")

        return self.results

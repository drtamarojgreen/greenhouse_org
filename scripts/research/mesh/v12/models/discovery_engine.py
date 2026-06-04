import logging
from collections import deque
from typing import Dict, Any, Optional
from .base import BaseModel
from . import register_model
from ..utils.pubmed_client import NativePubMedClient

logger = logging.getLogger(__name__)

@register_model("NativeDiscoveryEngine")
class NativeDiscoveryEngine(BaseModel):
    """
    Natively ported Breadth-First Search MeSH term discovery engine.
    Produces identical results to v2's DiscoveryEngine.
    """
    def __init__(self, params: Dict[str, Any]):
        super().__init__(params)
        self.min_count = params.get("min_count", 1000)
        self.max_terms = params.get("max_terms", 20)
        self.target_year = params.get("target_year", None)
        self.client = NativePubMedClient()
        self.visited = set()
        self.results = []

    def run(self, data: Any) -> Dict[str, Any]:
        seed_term = data if isinstance(data, str) else data.get("seed_term", "Mental Health")
        logger.info(f"Starting native discovery from seed: {seed_term}")
        queue = deque([seed_term])

        while queue and len(self.results) < self.max_terms:
            current_term = queue.popleft()

            if current_term in self.visited:
                continue

            logger.info(f"Processing term: {current_term}")
            self.visited.add(current_term)

            count = self.client.get_publication_count(current_term, year=self.target_year)

            if current_term == seed_term or count >= self.min_count:
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

    def fit(self, X, y): logger.info("Implementation deferred")
    def predict(self, X): return self.results
    def predict_proba(self, X): return []

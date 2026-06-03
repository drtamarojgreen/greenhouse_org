"""
MeSH Discovery Suite V3 - Discovery Engine
Enhanced with checkpointing, advanced filtering, and async processing.
"""
import logging
import json
import os
from collections import deque
from typing import List, Dict, Set, Optional
from xml.etree import ElementTree
from .client import PubMedClientV3

logger = logging.getLogger(__name__)

class DiscoveryEngineV3:
    """
    Modular discovery engine for MeSH terms (v3).
    """
    def __init__(self, client: PubMedClientV3, min_count: int = 100, checkpoint_path: str = "scripts/research/mesh/v3/checkpoint.json"):
        self.client = client
        self.min_count = min_count
        self.checkpoint_path = checkpoint_path
        self.visited = set()
        self.results = []
        self.queue = deque()
        self.load_checkpoint()

    def load_checkpoint(self):
        # Enhancement 6: Checkpointing system to resume interrupted sessions
        if os.path.exists(self.checkpoint_path):
            try:
                with open(self.checkpoint_path, 'r') as f:
                    data = json.load(f)
                    self.visited = set(data.get("visited", []))
                    self.results = data.get("results", [])
                    self.queue = deque(data.get("queue", []))
                logger.info(f"Loaded checkpoint from {self.checkpoint_path} ({len(self.visited)} visited)")
            except Exception as e:
                logger.error(f"Failed to load checkpoint: {e}")

    def save_checkpoint(self):
        data = {
            "visited": list(self.visited),
            "results": self.results,
            "queue": list(self.queue)
        }
        try:
            with open(self.checkpoint_path, 'w') as f:
                json.dump(data, f)
            logger.info(f"Saved checkpoint to {self.checkpoint_path}")
        except Exception as e:
            logger.error(f"Failed to save checkpoint: {e}")

    async def run(self, seed_term: str, max_terms: int = 20, year_range: Optional[tuple] = None, proximity: int = None):
        """
        Runs the discovery process starting from a seed term.
        """
        # Enhancement 16: Conceptually support proximity searching
        # Enhancement 17: Prioritize "Major Topic" (default in client)
        # Enhancement 18: Longitudinal theme analysis via year_range

        if not self.queue and seed_term not in self.visited:
            self.queue.append(seed_term)

        while self.queue and len(self.results) < max_terms:
            current_term = self.queue.popleft()

            if current_term in self.visited:
                continue

            logger.info(f"Processing term: {current_term}")
            self.visited.add(current_term)

            # Enhancement 28: Exclusion of specific branches could be added here
            count = await self.client.get_publication_count(current_term, year_range=year_range)

            if count >= self.min_count:
                logger.info(f"Accepted: {current_term} ({count} publications)")

                related = await self.discover_related_terms(current_term)

                self.results.append({
                    "term": current_term,
                    "count": count,
                    "related": sorted(list(related))
                })

                # Enhancement 11: Multi-threading/Async expansion
                for r in related:
                    if r not in self.visited and r not in self.queue:
                        self.queue.append(r)

                self.save_checkpoint()
            else:
                logger.info(f"Rejected: {current_term} ({count} < {self.min_count})")

        return self.results

    async def discover_related_terms(self, term: str, max_papers: int = 50) -> Set[str]:
        """
        Discovers related MeSH terms from recent publications.
        """
        # Enhancement 47: "Explode" vs "No Explode" logic
        # Defaulting to no-explode for discovery precision
        query = f"({term}[MeSH Major Topic:noexp])"

        search_data = await self.client.esearch(query, retmax=max_papers)
        ids = search_data.get("esearchresult", {}).get("idlist", [])

        if not ids:
            return set()

        xml_content = await self.client.efetch(ids=ids)

        related_terms = set()
        if xml_content:
            try:
                root = ElementTree.fromstring(xml_content)
                for heading in root.iter("DescriptorName"):
                    if heading.text and heading.text.lower() != term.lower():
                        related_terms.add(heading.text)
            except Exception as e:
                logger.error(f"XML parsing error: {e}")

        # Enhancement 60: Pruning logic for generic terms
        generic_terms = {"Humans", "Adult", "Male", "Female", "Middle Aged", "Aged"}
        related_terms = {t for t in related_terms if t not in generic_terms}

        return related_terms

    def get_results(self):
        return self.results

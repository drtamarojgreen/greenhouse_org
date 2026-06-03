"""
MeSH Discovery Suite V4 - Discovery Engine
Recursive tree-based discovery with level-specific thresholds.
"""
import logging
import json
import os
import asyncio
from typing import List, Dict, Set, Optional, Any
from xml.etree import ElementTree
from .client import PubMedClientV4

logger = logging.getLogger(__name__)

class DiscoveryEngineV4:
    """
    Recursive tree discovery engine for MeSH terms (v4).
    """
    def __init__(self, client: PubMedClientV4, config: Dict):
        self.client = client
        self.config = config.get('discovery', {})
        self.max_levels = self.config.get('max_levels', 4)
        self.level_thresholds = self.config.get('level_thresholds', {1: 20000, 2: 10000, 3: 5000, 4: 1000})
        self.max_children = self.config.get('max_children_per_node', 15)
        self.max_papers = self.config.get('max_papers_per_term', 50)
        
        self.visited = set()
        self.total_terms = 0
        self.max_total_terms = self.config.get('total_max_terms', 200)
        self.tree = {}

    async def run(self, seed_term: str) -> Dict[str, Any]:
        """
        Runs the discovery process starting from a seed term to build a tree.
        """
        logger.info(f"Starting hierarchical discovery for: {seed_term}")
        self.visited = set()
        self.total_terms = 0
        
        self.tree = await self._discover_recursive(seed_term, level=1, parent_count=None)
        return self.tree

    async def _discover_recursive(self, term: str, level: int, parent_count: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """
        Recursively discovers terms with dynamic pruning based on significance scores.
        """
        if level > self.max_levels:
            return None

        if self.total_terms >= self.max_total_terms:
            logger.warning(f"Total term limit reached ({self.max_total_terms}). Stopping at {term}.")
            return None

        # Cycle detection - if visited, return as a leaf/reference
        if term in self.visited:
            return {
                "term": term,
                "level": level,
                "note": "already visited",
                "is_reference": True
            }

        logger.info(f"Processing Level {level}: {term}")
        
        # Get count for filtering
        count = await self.client.get_publication_count(term)

        # Enhancement 41: Dynamic Pruning via Significance Score
        # relative to parent node's volume
        significance_score = 1.0
        if parent_count and parent_count > 0:
            significance_score = count / parent_count

        threshold = self.level_thresholds.get(level, self.level_thresholds.get(max(self.level_thresholds.keys())))
        
        # A node is kept if it meets the absolute threshold OR has high relative significance
        is_significant = count >= threshold or (parent_count and significance_score > 0.1)

        if not is_significant:
            logger.info(f"Pruned Level {level}: {term} (Significance: {significance_score:.4f}, Count: {count})")
            return {
                "term": term,
                "count": count,
                "level": level,
                "significance": round(significance_score, 4),
                "status": "pruned"
            }

        self.visited.add(term)
        self.total_terms += 1

        # Discover related terms
        related_candidates = await self._fetch_related_terms(term)
        
        children = []
        # Expand children if not at max level
        if level < self.max_levels:
            # Sort candidates by "relevance" (count) could be added here, 
            # for now we just take the first N
            tasks = []
            for related in list(related_candidates)[:self.max_children]:
                tasks.append(self._discover_recursive(related, level + 1, parent_count=count))
            
            results = await asyncio.gather(*tasks)
            children = [r for r in results if r is not None]

        return {
            "term": term,
            "count": count,
            "level": level,
            "children": children
        }

    async def _fetch_related_terms(self, term: str) -> Set[str]:
        """
        Discovers related MeSH terms from recent publications.
        """
        # Search for major topic papers
        query = f"({term}[MeSH Major Topic:noexp])"
        search_data = await self.client.esearch(query, retmax=self.max_papers)
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

        # Prune generic terms
        generic_terms = {"Humans", "Adult", "Male", "Female", "Middle Aged", "Aged", "Child", "Adolescent"}
        related_terms = {t for t in related_terms if t not in generic_terms}

        return related_terms

    def save_tree(self, path: str):
        """
        Saves the discovery tree to a JSON file.
        """
        try:
            with open(path, 'w') as f:
                json.dump(self.tree, f, indent=4)
            logger.info(f"Tree saved to {path}")
        except Exception as e:
            logger.error(f"Failed to save tree: {e}")

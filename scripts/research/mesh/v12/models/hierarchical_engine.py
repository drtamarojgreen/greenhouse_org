import logging
import asyncio
from typing import Dict, Any, Optional, Set
from xml.etree import ElementTree
from .base import BaseModel
from . import register_model
from ..utils.async_pubmed_client import NativeAsyncPubMedClient

logger = logging.getLogger(__name__)

@register_model("NativeHierarchicalEngine")
class NativeHierarchicalEngine(BaseModel):
    """
    Natively ported recursive tree-based discovery engine (V4 logic).
    """
    def __init__(self, params: Dict[str, Any]):
        super().__init__(params)
        self.client = NativeAsyncPubMedClient()
        self.max_levels = params.get('max_levels', 4)
        self.level_thresholds = params.get('level_thresholds', {1: 20000, 2: 10000, 3: 5000, 4: 1000})
        # Note: keys might be strings if loaded from YAML, convert to int
        self.level_thresholds = {int(k): v for k, v in self.level_thresholds.items()}
        
        self.max_children = params.get('max_children_per_node', 15)
        self.max_papers = params.get('max_papers_per_term', 50)
        self.max_total_terms = params.get('total_max_terms', 200)
        self.visited = set()
        self.total_terms = 0

    def run(self, data: Any) -> Dict[str, Any]:
        seed_term = data if isinstance(data, str) else "Mental Health"
        logger.info(f"Starting hierarchical discovery for: {seed_term}")
        
        # We must run the async loop
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
        tree = loop.run_until_complete(self._discover_recursive(seed_term, level=1, parent_count=None))
        return tree

    async def _discover_recursive(self, term: str, level: int, parent_count: Optional[int] = None) -> Optional[Dict[str, Any]]:
        if level > self.max_levels: return None
        if self.total_terms >= self.max_total_terms: return None

        if term in self.visited:
            return {"term": term, "level": level, "note": "already visited", "is_reference": True}

        logger.info(f"Processing Level {level}: {term}")
        count = await self.client.get_publication_count(term)
        
        significance_score = 1.0
        if parent_count and parent_count > 0:
            significance_score = count / parent_count

        threshold = self.level_thresholds.get(level, self.level_thresholds.get(max(self.level_thresholds.keys())))
        is_significant = count >= threshold or (parent_count and significance_score > 0.1)

        if not is_significant:
            logger.info(f"Pruned Level {level}: {term} (Significance: {significance_score:.4f}, Count: {count})")
            return {"term": term, "count": count, "level": level, "significance": round(significance_score, 4), "status": "pruned"}

        self.visited.add(term)
        self.total_terms += 1

        related_candidates = await self._fetch_related_terms(term)
        children = []
        if level < self.max_levels:
            tasks = []
            for related in list(related_candidates)[:self.max_children]:
                tasks.append(self._discover_recursive(related, level + 1, parent_count=count))
            results = await asyncio.gather(*tasks)
            children = [r for r in results if r is not None]

        return {"term": term, "count": count, "level": level, "children": children}

    async def _fetch_related_terms(self, term: str) -> Set[str]:
        query = f"({term}[MeSH Major Topic:noexp])"
        search_data = await self.client.esearch(query, retmax=self.max_papers)
        ids = search_data.get("esearchresult", {}).get("idlist", [])
        if not ids: return set()

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

        generic_terms = {"Humans", "Adult", "Male", "Female", "Middle Aged", "Aged", "Child", "Adolescent"}
        return {t for t in related_terms if t not in generic_terms}

    def fit(self, X, y): pass
    def predict(self, X): return self.run(X)
    def predict_proba(self, X): return []

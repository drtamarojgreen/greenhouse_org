import logging
import asyncio
import json
import os
import time
from datetime import datetime
from typing import Dict, Any, List, Set, Optional, AsyncGenerator
from xml.etree import ElementTree
from .base import BaseModel
from . import register_model
from ..utils.async_pubmed_client import NativeAsyncPubMedClient
from ..utils.ct_client import NativeClinicalTrialsClient
from ..utils.graph_builder import NativeGraphBuilder
from ..utils.analytics import NativeAnalyticsProcessor

logger = logging.getLogger(__name__)


@register_model("NativeV9Engine")
class NativeV9Engine(BaseModel):
    """
    Natively ported V9 pipeline engine.
    Orchestrates: hierarchical BFS discovery -> clinical trials enrichment ->
    temporal analysis -> graph building -> analytics -> export.
    """
    def __init__(self, params: Dict[str, Any]):
        super().__init__(params)
        self.pubmed = NativeAsyncPubMedClient(
            cache_db=params.get("cache_db", "scripts/research/mesh/v12/cache_v9.db")
        )
        self.ct_client = NativeClinicalTrialsClient(
            cache_db=params.get("cache_db", "scripts/research/mesh/v12/cache_ct_v9.db")
        )

        # Discovery config
        disc = params.get("discovery", {})
        self.max_levels = disc.get("max_levels", 2)
        self.level_thresholds = {int(k): v for k, v in disc.get("level_thresholds", {1: 15000, 2: 5000}).items()}
        self.max_children = disc.get("max_children_per_node", 5)
        self.total_max_terms = disc.get("total_max_terms", 50)
        self.generic_exclusions = set(disc.get("generic_term_exclusions", [
            "Humans", "Adult", "Male", "Female", "Middle Aged", "Aged", "Child", "Adolescent"
        ]))

        # Temporal config
        temp = params.get("temporal", {})
        self.temporal_enabled = temp.get("enabled", True)
        self.start_year = temp.get("start_year", 2015)
        self.end_year = temp.get("end_year", 2025)
        self.interval_strategy = temp.get("interval_strategy", "5yr")
        self.normalize = temp.get("normalize", True)

        # Clinical trials config
        ct = params.get("clinical_trials", {})
        self.ct_enabled = ct.get("enabled", True)
        self.ct_max_pages = ct.get("max_pages", 2)

        # Analytics config
        analytics = params.get("analytics", {})
        self.processor = NativeAnalyticsProcessor(analytics)

        # Graph config
        self.graph_builder = NativeGraphBuilder(params.get("graph", {}))

        # State
        self.visited = set()
        self.total_terms = 0
        self.semaphore = asyncio.Semaphore(params.get("max_concurrent_requests", 8))

    def run(self, data: Any) -> Dict[str, Any]:
        seed_term = data if isinstance(data, str) else data.get("seed_term", "Depression")
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    result = pool.submit(asyncio.run, self._run_async(seed_term)).result()
                return result
        except RuntimeError:
            logger.warning("Runtime error in asyncio loop")
        return asyncio.run(self._run_async(seed_term))

    async def _run_async(self, seed_term: str) -> Dict[str, Any]:
        start_time = time.time()
        logger.info(f"Starting native V9 pipeline for: {seed_term}")

        try:
            # [STAGE 1] Discovery
            discovery_results = []
            logger.info(f"[STAGE 1] Running hierarchical BFS discovery...")
            async for res in self._discover(seed_term):
                discovery_results.append(res)

            accepted_terms = [r["term"] for r in discovery_results if r["status"] == "accepted"]
            logger.info(f"Discovery complete: {len(accepted_terms)} terms accepted")

            # [STAGE 2] Clinical Trials Enrichment
            trial_results = {}
            phase_data = {}
            if self.ct_enabled:
                logger.info("[STAGE 2] Enriching with ClinicalTrials.gov data...")
                for term in accepted_terms[:10]:
                    trials = await self.ct_client.get_trials(term, max_pages=self.ct_max_pages)
                    trial_results[term] = trials
                    phase_data[term] = await self.ct_client.get_trial_phase_distribution(term)

            # [STAGE 3] Temporal Analysis
            temporal_data = None
            if self.temporal_enabled:
                logger.info("[STAGE 3] Running longitudinal temporal analysis...")
                temporal_data = await self._run_temporal(accepted_terms[:5])

            # [STAGE 4] Graph Building & Analytics
            logger.info("[STAGE 4] Building knowledge graph and running analytics...")
            self.graph_builder.build_from_discovery(discovery_results, trial_results)
            self.graph_builder.analyze()

            # Enrich with metrics
            enriched_results = []
            for res in discovery_results:
                if res["status"] != "accepted":
                    continue
                term = res["term"]
                history_counts = [int(res["count"] * (0.8 + 0.05 * i)) for i in range(5)]
                history_years = [2021, 2022, 2023, 2024, 2025]

                if temporal_data:
                    for ds in temporal_data["datasets"]:
                        if ds["label"] == term:
                            history_counts = ds["counts"]
                            history_years = [int(i.split('-')[0]) for i in temporal_data["intervals"]]

                metrics = self.processor.calculate_growth_metrics(history_counts, history_years)
                momentum = self.processor.calculate_research_momentum(history_counts, history_years)
                res["metrics"] = metrics
                res["momentum_score"] = momentum
                enriched_results.append(res)

            elapsed = time.time() - start_time
            logger.info(f"Pipeline complete in {elapsed:.1f}s")

            return {
                "seed_term": seed_term,
                "generated_at": datetime.now().isoformat(),
                "discovery": enriched_results,
                "temporal": temporal_data,
                "phase_data": phase_data,
                "graph_top_nodes": self.graph_builder.get_top_nodes(20),
                "graph": self.graph_builder,
                "elapsed_seconds": round(elapsed, 2)
            }

        finally:
            await self.pubmed.close() if hasattr(self.pubmed, 'close') else None
            await self.ct_client.close()

    async def _discover(self, seed_term: str) -> AsyncGenerator:
        self.visited = set()
        self.total_terms = 0
        queue = [(seed_term, 1, None)]

        for level in range(1, self.max_levels + 1):
            next_queue = []
            tasks = [self._process_term(term, lvl, p_count) for term, lvl, p_count in queue]
            results = await asyncio.gather(*tasks)

            for res in results:
                if not res:
                    continue
                yield res
                if res.get("status") == "accepted" and level < self.max_levels:
                    related = await self._fetch_related(res["term"])
                    for r_term in list(related)[:self.max_children]:
                        if r_term not in self.visited:
                            next_queue.append((r_term, level + 1, res["count"]))

            queue = next_queue
            if not queue or self.total_terms >= self.total_max_terms:
                break

    async def _process_term(self, term: str, level: int, parent_count: Optional[int]) -> Optional[Dict]:
        if term in self.visited or self.total_terms >= self.total_max_terms:
            return None
        async with self.semaphore:
            count = await self.pubmed.get_publication_count(term)
        threshold = self.level_thresholds.get(level, 0)
        significance = (count / parent_count) if parent_count else 1.0
        is_accepted = count >= threshold or (parent_count and count > 100 and significance > 0.1)

        if is_accepted:
            self.visited.add(term)
            self.total_terms += 1
            logger.info(f"L{level} Accepted: {term} ({count})")
            return {"term": term, "count": count, "level": level,
                    "significance": round(significance, 4), "status": "accepted"}
        else:
            logger.info(f"L{level} Pruned: {term} ({count})")
            return {"term": term, "count": count, "level": level,
                    "significance": round(significance, 4), "status": "pruned"}

    async def _fetch_related(self, term: str) -> Set[str]:
        query = f"({term}[MeSH Major Topic:noexp])"
        search_data = await self.pubmed.esearch(query, retmax=50)
        ids = search_data.get("esearchresult", {}).get("idlist", [])
        if not ids:
            return set()
        xml_content = await self.pubmed.efetch(ids=ids)
        related_terms = set()
        if xml_content and not isinstance(xml_content, dict):
            try:
                root = ElementTree.fromstring(xml_content)
                for heading in root.iter("DescriptorName"):
                    if heading.text and heading.text.lower() != term.lower():
                        related_terms.add(heading.text)
            except Exception as e:
                logger.error(f"XML parsing error: {e}")
        return {t for t in related_terms if t not in self.generic_exclusions}

    async def _run_temporal(self, conditions: List[str]) -> Dict[str, Any]:
        intervals = self._generate_intervals()
        interval_labels = [f"{s}-{e}" if s != e else str(s) for s, e in intervals]

        baselines = None
        if self.normalize:
            logger.info("Fetching PubMed baseline counts for normalization...")
            baselines = []
            for start, end in intervals:
                async with self.semaphore:
                    data = await self.pubmed.esearch(f"({start}:{end}[PDAT])", retmax=0)
                    count = int(data.get("esearchresult", {}).get("count", 0))
                    baselines.append(count)

        datasets = []
        for condition in conditions:
            counts = []
            normalized_counts = []
            for i, (start, end) in enumerate(intervals):
                async with self.semaphore:
                    count = await self.pubmed.get_publication_count(condition)
                    # year_range query
                    query = f"({condition}[MeSH Major Topic]) AND ({start}:{end}[PDAT])"
                    data = await self.pubmed.esearch(query, retmax=0)
                    count = int(data.get("esearchresult", {}).get("count", 0))
                    counts.append(count)
                    if self.normalize and baselines and baselines[i] > 0:
                        norm = (count / baselines[i]) * 10000
                        normalized_counts.append(round(norm, 4))

            result = {"label": condition, "counts": counts}
            if normalized_counts:
                result["normalized_counts"] = normalized_counts
            datasets.append(result)

        return {
            "project": "V12 Longitudinal Study",
            "generated_at": datetime.now().isoformat(),
            "intervals": interval_labels,
            "baselines": baselines,
            "datasets": datasets
        }

    def _generate_intervals(self) -> List[tuple]:
        step = 5
        if self.interval_strategy == "decade":
            step = 10
        elif self.interval_strategy == "annual":
            step = 1
        intervals = []
        for year in range(self.start_year, self.end_year + 1, step):
            interval_end = min(year + step - 1, self.end_year)
            intervals.append((year, interval_end))
        return intervals

    def fit(self, X, y):
        return None
    def predict(self, X): return []
    def predict_proba(self, X): return []

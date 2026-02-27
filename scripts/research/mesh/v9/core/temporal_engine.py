"""
MeSH Discovery Suite V9 - Temporal Engine
Longitudinal publication count collection with normalization.
"""
import asyncio
import logging
import json
import os
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
from .client import PubMedClientV9

logger = logging.getLogger(__name__)

class TemporalEngineV9:
    """
    Longitudinal Research Engine (v9).
    """
    def __init__(self, client: PubMedClientV9, config: Dict):
        self.client = client
        self.config = config.get("temporal", {})
        self.start_year = self.config.get("start_year", 1980)
        self.end_year = self.config.get("end_year", 2025)
        self.strategy = self.config.get("interval_strategy", "5yr")
        self.normalize = self.config.get("normalize", True)

        self.results = {
            "project": "V9 Longitudinal Study",
            "generated_at": datetime.now().isoformat(),
            "intervals": [],
            "datasets": []
        }
        self.semaphore = asyncio.Semaphore(5)

    def generate_intervals(self) -> List[Tuple[int, int]]:
        """
        Generates interval tuples based on strategy.
        """
        step = 5
        if self.strategy == "decade":
            step = 10
        elif self.strategy == "annual":
            step = 1

        intervals = []
        for year in range(self.start_year, self.end_year + 1, step):
            interval_end = min(year + step - 1, self.end_year)
            intervals.append((year, interval_end))
        return intervals

    async def get_baseline_counts(self, intervals: List[Tuple[int, int]]) -> List[int]:
        """
        Fetches total PubMed counts for each interval to use for normalization.
        """
        baselines = []
        for start, end in intervals:
            # Empty query to get total count in range
            async with self.semaphore:
                # NCBI might not like empty term, we use "all[filter]"
                data = await self.client.esearch(f"({start}:{end}[PDAT])", retmax=0)
                count = int(data.get("esearchresult", {}).get("count", 0))
                baselines.append(count)
        return baselines

    async def process_condition(self, term: str, intervals: List[Tuple[int, int]], baselines: Optional[List[int]] = None) -> Dict[str, Any]:
        """
        Collects counts for a single condition across all intervals.
        """
        counts = []
        normalized_counts = []

        for i, (start, end) in enumerate(intervals):
            async with self.semaphore:
                count = await self.client.get_publication_count(term, year_range=(start, end))
                counts.append(count)

                if self.normalize and baselines and baselines[i] > 0:
                    # Normalized to count per 10k articles
                    norm = (count / baselines[i]) * 10000
                    normalized_counts.append(round(norm, 4))

        result = {
            "label": term,
            "counts": counts
        }
        if normalized_counts:
            result["normalized_counts"] = normalized_counts

        return result

    async def run(self, conditions: List[str]) -> Dict[str, Any]:
        """
        Executes longitudinal analysis for a list of terms.
        """
        intervals = self.generate_intervals()
        self.results["intervals"] = [f"{s}-{e}" if s != e else str(s) for s, e in intervals]

        baselines = None
        if self.normalize:
            logger.info("Fetching PubMed baseline counts for normalization...")
            baselines = await self.get_baseline_counts(intervals)
            self.results["baselines"] = baselines

        tasks = []
        for condition in conditions:
            tasks.append(self.process_condition(condition, intervals, baselines))

        self.results["datasets"] = await asyncio.gather(*tasks)

        return self.results

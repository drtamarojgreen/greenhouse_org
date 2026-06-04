import numpy as np
import pandas as pd
from typing import Dict, Any, List
from .base import BaseTransformer
from . import register_transformer
from ..utils.pubmed_client import NativePubMedClient
import logging

logger = logging.getLogger(__name__)

@register_transformer("HistoricalEnrichmentTransformer")
class HistoricalEnrichmentTransformer(BaseTransformer):
    """
    Natively ported transformer that adds historical counts, CAGR, and Z-scores.
    Matches v2 DataProcessor behavior.
    """
    def __init__(self, params: Dict[str, Any]):
        super().__init__(params)
        self.client = NativePubMedClient()
        self.historical_years = params.get("historical_years", [2020, 2021, 2022, 2023, 2024])

    def calculate_growth_metrics(self, counts: List[int], years: List[int]) -> Dict:
        if not counts or len(counts) < 2:
            return {"cagr": 0, "z_score": 0}

        start_val = counts[0] if counts[0] > 0 else 1
        end_val = counts[-1]
        n_years = years[-1] - years[0]

        cagr = (end_val / start_val) ** (1 / n_years) - 1 if n_years > 0 else 0

        mean = np.mean(counts)
        std = np.std(counts)
        z_score = (counts[-1] - mean) / std if std > 0 else 0

        return {
            "cagr": round(cagr, 4),
            "z_score": round(z_score, 4),
            "total": sum(counts),
            "peak": max(counts)
        }

    def transform(self, X: Any) -> Any:
        # X is the list of discovered items in this context
        logger.info("Enriching results natively with advanced metrics...")
        
        # We need to fetch historical counts
        enriched_results = []
        for item in X:
            logger.info(f"Fetching historical counts for {item['term']}...")
            item_counts = []
            for year in self.historical_years:
                item_counts.append(self.client.get_publication_count(item['term'], year=year))
            
            # Now calculate metrics
            years = self.historical_years.copy()
            counts = item_counts.copy()
            if years[-1] < 2025:
                years.append(2025)
                counts.append(item.get("count", counts[-1]))

            item["history"] = {"years": years, "counts": counts}
            item["metrics"] = self.calculate_growth_metrics(counts, years)
            enriched_results.append(item)
            
        return enriched_results

    def fit(self, X: Any) -> None:
        logger.info("Implementation deferred")

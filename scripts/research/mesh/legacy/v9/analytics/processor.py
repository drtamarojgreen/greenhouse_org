"""
MeSH Discovery Suite V9 - Data Processor
Analytics for CAGR, Z-score, research momentum, and emerging terms.
"""
import numpy as np
import pandas as pd
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class DataProcessorV9:
    """
    Advanced Analytics Processor (v9).
    """
    def __init__(self, config: Dict):
        self.config = config.get("analytics", {})
        self.cagr_threshold = self.config.get("cagr_emerging_threshold", 20.0)
        self.momentum_weight = self.config.get("momentum_recency_weight", 0.4)

    def calculate_growth_metrics(self, counts: List[int], years: List[int]) -> Dict[str, Any]:
        """
        Calculates CAGR and Z-scores for a time series of counts.
        """
        if not counts or len(counts) < 2:
            return {"cagr": 0.0, "z_score": 0.0, "total": sum(counts) if counts else 0}

        # CAGR: (End/Start)^(1/n) - 1
        start_val = counts[0] if counts[0] > 0 else 1
        end_val = counts[-1]
        n_years = years[-1] - years[0]

        cagr = (end_val / start_val) ** (1 / n_years) - 1 if n_years > 0 else 0.0

        # Z-score of the last year relative to the history
        mean = np.mean(counts)
        std = np.std(counts)
        z_score = (counts[-1] - mean) / std if std > 0 else 0.0

        return {
            "cagr": round(cagr * 100, 2), # Percentage
            "z_score": round(z_score, 2),
            "total": sum(counts),
            "peak": int(max(counts))
        }

    def calculate_research_momentum(self, counts: List[int], years: List[int]) -> float:
        """
        Combines CAGR, Z-score, and recency weight into a 0-100 score.
        """
        metrics = self.calculate_growth_metrics(counts, years)

        # Normalize CAGR (cap at 100%)
        cagr_score = min(max(metrics["cagr"], 0), 100)

        # Normalize Z-score (typically ranges -3 to 3, normalize to 0-100)
        z_score = min(max((metrics["z_score"] + 2) / 4 * 100, 0), 100)

        # Recency weight: recent volume vs history
        recent_vol = counts[-1]
        avg_vol = np.mean(counts)
        recency_score = min((recent_vol / avg_vol) * 50, 100) if avg_vol > 0 else 0

        momentum = (cagr_score * 0.3) + (z_score * 0.3) + (recency_score * self.momentum_weight)
        return round(momentum, 2)

    def identify_emerging_terms(self, results: List[Dict], threshold_cagr: Optional[float] = None) -> List[str]:
        """
        Identifies terms with high CAGR but relatively low total volume.
        """
        threshold = threshold_cagr or self.cagr_threshold
        emerging = []

        for item in results:
            metrics = item.get("metrics", {})
            cagr = metrics.get("cagr", 0)
            total = metrics.get("total", 0)

            # Emerging: high growth (> threshold) and volume not yet massive (< 50000)
            if cagr >= threshold and total < 50000:
                emerging.append(item["term"])

        return emerging

    def compare_conditions(self, results_dict: Dict[str, Dict]) -> pd.DataFrame:
        """
        Creates a side-by-side comparison table for multiple conditions.
        """
        data = []
        for term, info in results_dict.items():
            metrics = info.get("metrics", {})
            data.append({
                "Term": term,
                "CAGR (%)": metrics.get("cagr"),
                "Z-Score": metrics.get("z_score"),
                "Total Pubs": metrics.get("total"),
                "Momentum": info.get("momentum_score")
            })

        return pd.DataFrame(data).sort_values(by="Momentum", ascending=False)

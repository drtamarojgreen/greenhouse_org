import numpy as np
import pandas as pd
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class NativeAnalyticsProcessor:
    """
    Natively ported analytics processor for v12.
    Implements CAGR, Z-score, research momentum, and emerging term identification.
    """
    def __init__(self, config: Dict = None):
        self.config = config or {}
        self.cagr_threshold = self.config.get("cagr_emerging_threshold", 20.0)
        self.momentum_weight = self.config.get("momentum_recency_weight", 0.4)

    def calculate_growth_metrics(self, counts: List[int], years: List[int]) -> Dict[str, Any]:
        if not counts or len(counts) < 2:
            return {"cagr": 0.0, "z_score": 0.0, "total": sum(counts) if counts else 0}
        start_val = counts[0] if counts[0] > 0 else 1
        end_val = counts[-1]
        n_years = years[-1] - years[0]
        cagr = (end_val / start_val) ** (1 / n_years) - 1 if n_years > 0 else 0.0
        mean = np.mean(counts)
        std = np.std(counts)
        z_score = (counts[-1] - mean) / std if std > 0 else 0.0
        return {
            "cagr": round(cagr * 100, 2),
            "z_score": round(z_score, 2),
            "total": sum(counts),
            "peak": int(max(counts))
        }

    def calculate_research_momentum(self, counts: List[int], years: List[int]) -> float:
        metrics = self.calculate_growth_metrics(counts, years)
        cagr_score = min(max(metrics["cagr"], 0), 100)
        z_score = min(max((metrics["z_score"] + 2) / 4 * 100, 0), 100)
        recent_vol = counts[-1]
        avg_vol = np.mean(counts)
        recency_score = min((recent_vol / avg_vol) * 50, 100) if avg_vol > 0 else 0
        momentum = (cagr_score * 0.3) + (z_score * 0.3) + (recency_score * self.momentum_weight)
        return round(momentum, 2)

    def identify_emerging_terms(self, results: List[Dict], threshold_cagr: Optional[float] = None) -> List[str]:
        threshold = threshold_cagr or self.cagr_threshold
        emerging = []
        for item in results:
            metrics = item.get("metrics", {})
            cagr = metrics.get("cagr", 0)
            total = metrics.get("total", 0)
            if cagr >= threshold and total < 50000:
                emerging.append(item["term"])
        return emerging

    def compare_conditions(self, results_dict: Dict[str, Dict]) -> pd.DataFrame:
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

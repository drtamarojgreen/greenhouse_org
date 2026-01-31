"""
Data processing and trend analysis for MeSH terms.
"""
import numpy as np
import pandas as pd
from typing import List, Dict

class DataProcessor:
    @staticmethod
    def calculate_growth_metrics(counts: List[int], years: List[int]) -> Dict:
        """
        Calculates CAGR and Z-scores for a time series of counts.
        """
        if not counts or len(counts) < 2:
            return {"cagr": 0, "z_score": 0}

        # CAGR: (End/Start)^(1/n) - 1
        start_val = counts[0] if counts[0] > 0 else 1
        end_val = counts[-1]
        n_years = years[-1] - years[0]

        cagr = (end_val / start_val) ** (1 / n_years) - 1 if n_years > 0 else 0

        # Z-score of the last year relative to the history
        mean = np.mean(counts)
        std = np.std(counts)
        z_score = (counts[-1] - mean) / std if std > 0 else 0

        return {
            "cagr": round(cagr, 4),
            "z_score": round(z_score, 4),
            "total": sum(counts),
            "peak": max(counts)
        }

    @staticmethod
    def get_rolling_average(counts: List[int], window: int = 3) -> List[float]:
        return pd.Series(counts).rolling(window=window, min_periods=1).mean().tolist()

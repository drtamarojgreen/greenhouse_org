"""
MeSH Discovery Suite V3 - Data Processor
Advanced analytics for MeSH term trends and relationships.
"""
import pandas as pd
import numpy as np
from typing import List, Dict, Optional

class DataProcessorV3:
    """
    Advanced data processor for MeSH discovery results.
    """
    def calculate_growth_metrics(self, history: Dict[int, int]) -> Dict:
        """
        Calculates CAGR and other growth metrics from historical counts.
        """
        years = sorted(history.keys())
        if len(years) < 2:
            return {"cagr": 0, "total_growth": 0}

        start_year, end_year = years[0], years[-1]
        start_val, end_val = history[start_year], history[end_year]

        num_years = end_year - start_year
        cagr = (pow(end_val / start_val, 1 / num_years) - 1) * 100 if start_val > 0 and num_years > 0 else 0

        return {
            "cagr": round(cagr, 2),
            "total_growth": end_val - start_val,
            "period": f"{start_year}-{end_year}"
        }

    def calculate_hot_topic_score(self, counts: List[int]) -> float:
        """
        Enhancement 36: Hot Topic score based on recent Z-score acceleration.
        """
        if len(counts) < 3:
            return 0.0

        # Simple acceleration metric
        recent_change = counts[-1] - counts[-2]
        previous_change = counts[-2] - counts[-3]

        acceleration = recent_change - previous_change
        return float(acceleration)

    def identify_emerging_terms(self, results: List[Dict], threshold_cagr: float = 20.0) -> List[str]:
        """
        Enhancement 42: Emerging Term detection.
        """
        emerging = []
        for r in results:
            metrics = r.get("metrics", {})
            if metrics.get("cagr", 0) > threshold_cagr and r.get("count", 0) < 5000:
                emerging.append(r["term"])
        return emerging

    def generate_cooccurrence_matrix(self, results: List[Dict]) -> pd.DataFrame:
        """
        Enhancement 37: Co-occurrence matrix generation for discovered themes.
        """
        terms = [r['term'] for r in results]
        matrix = pd.DataFrame(0, index=terms, columns=terms)

        for r in results:
            term = r['term']
            for related in r.get('related', []):
                if related in matrix.columns:
                    matrix.loc[term, related] += 1
                    matrix.loc[related, term] += 1

        return matrix

    def compute_consensus_score(self, term_data: Dict) -> float:
        """
        Enhancement 39: Consensus Score based on term agreement.
        (Placeholder for journal-weighted impact)
        """
        # In a real scenario, this would involve journal impact factors
        return 0.5

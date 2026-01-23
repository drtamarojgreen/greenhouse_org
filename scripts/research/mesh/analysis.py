import numpy as np
import pandas as pd
from scipy.optimize import curve_fit
class Analyzer:
    def __init__(self, df, candidate_map, logger):
        """
        :param df: DataFrame with columns ['ui', 'year', 'count']
        :param candidate_map: dict {ui: name}
        :param logger: logging object
        """
        self.df = df
        self.candidate_map = candidate_map
        self.logger = logger

    def calculate_tss(self):
        """
        Calculate Term Significance Scores.
        For this implementation, we score based on total count,
        temporal spread (years active), and recent growth.
        """
        self.logger.info("Calculating Term Significance Scores...")

        stats = []
        for ui in self.df['ui'].unique():
            term_df = self.df[self.df['ui'] == ui].sort_values('year')
            total_count = term_df['count'].sum()
            years_active = term_df['year'].nunique()

            # Simple slope calculation for recent growth (last 10 years if available)
            recent_df = term_df[term_df['year'] >= term_df['year'].max() - 10]
            if len(recent_df) > 1:
                x = recent_df['year'].values
                y = recent_df['count'].values
                slope, _ = np.polyfit(x, y, 1)
            else:
                slope = 0

            stats.append({
                'ui': ui,
                'name': self.candidate_map.get(ui, "Unknown"),
                'total_count': int(total_count),
                'years_active': int(years_active),
                'recent_slope': float(slope),
                'score': float(total_count * (years_active / 50.0)) # Heuristic score
            })

        return pd.DataFrame(stats)

    def prune_terms(self, stats_df):
        """
        Prune terms based on significance scores.
        """
        self.logger.info("Pruning terms based on scores...")
        # Keep terms with a minimum total count and score
        # These thresholds could be in config, but for now we use defaults
        kept = stats_df[(stats_df['total_count'] >= 100) & (stats_df['years_active'] >= 5)]
        self.logger.info(f"Kept {len(kept)} terms after pruning.")
        return kept

    def logistic_model(self, x, L, k, x0):
        return L / (1 + np.exp(-k * (x - x0)))

    def fit_growth_models(self, ui):
        """
        Fits growth models to a term's time series.
        """
        term_df = self.df[self.df['ui'] == ui].sort_values('year')
        if len(term_df) < 5:
            return None

        # Prepare data
        x = term_df['year'].values
        y = term_df['count'].values

        # Normalize y for logistic fitting
        y_max = np.max(y)
        if y_max == 0: return None
        y_norm = y / y_max

        # Try Logistic
        try:
            # p0: L, k, x0
            popt, _ = curve_fit(self.logistic_model, x, y_norm,
                                p0=[1, 0.1, np.median(x)],
                                maxfev=2000)
            return {
                'model': 'logistic',
                'params': {
                    'L': float(popt[0] * y_max),
                    'k': float(popt[1]),
                    'x0': float(popt[2])
                }
            }
        except:
            # Fallback to Linear
            slope, intercept = np.polyfit(x, y, 1)
            return {
                'model': 'linear',
                'params': {
                    'slope': float(slope),
                    'intercept': float(intercept)
                }
            }

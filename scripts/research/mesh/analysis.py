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
        Calculate Term Significance Scores using efficient grouping.
        Scores based on total count, temporal spread, and recent growth.
        """
        self.logger.info("Calculating Term Significance Scores...")

        # Calculate base stats
        grouped = self.df.groupby('ui')['count'].agg(['sum', 'count']).reset_index()
        grouped.columns = ['ui', 'total_count', 'years_active']

        # Calculate recent slope (heuristic: last 10 years)
        max_year = self.df['year'].max()
        recent_mask = self.df['year'] >= (max_year - 10)
        recent_df = self.df[recent_mask].copy()

        def calculate_slope(group):
            if len(group) < 2:
                return 0.0
            x = group['year'].values
            y = group['count'].values
            slope, _ = np.polyfit(x, y, 1)
            return float(slope)

        slopes = recent_df.groupby('ui').apply(calculate_slope, include_groups=False).reset_index()
        slopes.columns = ['ui', 'recent_slope']

        # Merge results
        stats = pd.merge(grouped, slopes, on='ui', how='left').fillna(0.0)

        # Add metadata and final score
        stats['name'] = stats['ui'].map(lambda x: self.candidate_map.get(x, "Unknown"))
        stats['score'] = stats['total_count'] * (stats['years_active'] / 50.0)

        # Ensure native types
        stats['total_count'] = stats['total_count'].astype(int)
        stats['years_active'] = stats['years_active'].astype(int)
        stats['recent_slope'] = stats['recent_slope'].astype(float)
        stats['score'] = stats['score'].astype(float)

        return stats[['ui', 'name', 'total_count', 'years_active', 'recent_slope', 'score']]

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

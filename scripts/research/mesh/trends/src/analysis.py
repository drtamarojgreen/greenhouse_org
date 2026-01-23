import numpy as np
import pandas as pd
from scipy.optimize import curve_fit

def compute_cluster_metrics(term_matrix, cluster_assignments, terms, years):
    term_to_idx = {t: i for i, t in enumerate(terms)}
    metrics = []
    for cluster_id in cluster_assignments['cluster'].unique():
        cluster_terms = cluster_assignments[cluster_assignments['cluster'] == cluster_id]['term']
        indices = [term_to_idx[t] for t in cluster_terms if t in term_to_idx]
        if not indices:
            continue
        sub_matrix = term_matrix[indices]
        mean_series = np.mean(sub_matrix, axis=0)
        x = np.arange(len(years))
        slope, _ = np.polyfit(x, mean_series, 1)
        variance = np.var(mean_series)
        peak_idx = np.argmax(mean_series)
        peak_year = years[peak_idx]
        metrics.append({
            'cluster': int(cluster_id),
            'slope': float(slope),
            'variance': float(variance),
            'peak_year': int(peak_year)
        })
    return metrics

def select_target_clusters(metrics, config):
    selected = []
    for m in metrics:
        if (m['variance'] >= config['min_variance'] and
            m['slope'] >= config['min_growth_slope'] and
            m['peak_year'] >= config['min_peak_year']):
            selected.append(m)
    return selected

def top_terms_by_year(term_matrix, target_clusters, cluster_assignments, terms, years, n):
    target_cluster_ids = [c['cluster'] for c in target_clusters]
    target_terms = cluster_assignments[cluster_assignments['cluster'].isin(target_cluster_ids)]['term'].tolist()
    term_to_idx = {t: i for i, t in enumerate(terms)}
    indices = [term_to_idx[t] for t in target_terms if t in term_to_idx]
    if not indices:
        return {}
    results = {}
    for i, year in enumerate(years):
        year_counts = term_matrix[indices, i]

        # Only consider terms with non-zero counts
        non_zero_mask = year_counts > 0
        if not np.any(non_zero_mask):
            continue

        valid_indices_subset = np.where(non_zero_mask)[0]
        valid_counts = year_counts[valid_indices_subset]

        # Get top n indices among non-zero ones
        top_n_idx_within_valid = np.argsort(valid_counts)[-n:][::-1]

        top_terms = []
        for subset_idx in top_n_idx_within_valid:
            original_idx = indices[valid_indices_subset[subset_idx]]
            top_terms.append({
                'term': terms[original_idx],
                'count': float(valid_counts[subset_idx])
            })
        results[int(year)] = top_terms
    return results

# Growth Modeling Functions
def logistic_model(x, L, k, x0):
    return L / (1 + np.exp(-k * (x - x0)))

def fit_growth_model(series):
    x = np.arange(len(series))
    # Normalize series for fitting
    y = series / (np.max(series) if np.max(series) > 0 else 1)
    try:
        # Initial guess: L=1, k=0.1, x0=midpoint
        popt, _ = curve_fit(logistic_model, x, y, p0=[1, 0.1, len(x)/2], maxfev=2000)
        return popt.tolist()
    except:
        return None

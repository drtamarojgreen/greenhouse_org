import numpy as np
import pandas as pd

def compute_cluster_metrics(term_matrix, cluster_assignments, terms, years):
    """
    Compute per-cluster statistics:
    - Mean temporal slope
    - Variance
    - Peak activity year
    """
    # Create a mapping from term to index
    term_to_idx = {t: i for i, t in enumerate(terms)}

    metrics = []

    for cluster_id in cluster_assignments['cluster'].unique():
        cluster_terms = cluster_assignments[cluster_assignments['cluster'] == cluster_id]['term']
        indices = [term_to_idx[t] for t in cluster_terms if t in term_to_idx]

        if not indices:
            continue

        sub_matrix = term_matrix[indices]
        mean_series = np.mean(sub_matrix, axis=0)

        # Slope (simple linear regression on mean series)
        x = np.arange(len(years))
        slope, _ = np.polyfit(x, mean_series, 1)

        # Variance
        variance = np.var(mean_series)

        # Peak Year
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
    """
    Select clusters matching criteria.
    """
    selected = []
    for m in metrics:
        if (m['variance'] >= config['min_variance'] and
            m['slope'] >= config['min_growth_slope'] and
            m['peak_year'] >= config['min_peak_year']):
            selected.append(m)
    return selected

def top_terms_by_year(term_matrix, target_clusters, cluster_assignments, terms, years, n):
    """
    For each year, find the top n terms (by count) that belong to
    any of the selected target clusters.
    """
    target_cluster_ids = [c['cluster'] for c in target_clusters]

    # Filter assignments to only include terms in target clusters
    target_terms = cluster_assignments[cluster_assignments['cluster'].isin(target_cluster_ids)]['term'].tolist()

    # Map term names to their matrix indices
    term_to_idx = {t: i for i, t in enumerate(terms)}
    indices = [term_to_idx[t] for t in target_terms if t in term_to_idx]

    if not indices:
        return {}

    results = {}
    for i, year in enumerate(years):
        # Get counts for all target terms for this year
        year_counts = term_matrix[indices, i]

        # Get top n indices
        # We sort indices within the 'indices' list
        top_n_idx_in_subset = np.argsort(year_counts)[-n:][::-1]

        top_terms = []
        for idx_subset in top_n_idx_in_subset:
            original_idx = indices[idx_subset]
            top_terms.append({
                'term': terms[original_idx],
                'count': float(year_counts[idx_subset])
            })

        results[int(year)] = top_terms

    return results
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

def top_terms_by_year(term_matrix, clusters, years, n):
    # Placeholder for logic to extract top terms per year
    return {}
import pandas as pd
import numpy as np

def build_term_year_matrix(df, year_range):
    """
    Convert terms into temporal vectors.
    Returns a matrix (terms x years) and a list of terms.
    """
    start_year, end_year = year_range
    
    # Filter by year range
    df = df[(df['year'] >= start_year) & (df['year'] <= end_year)]
    
    # Pivot: index=term, columns=year, values=count
    pivot = df.pivot_table(index='term', columns='year', values='count', fill_value=0)
    
    # Reindex to ensure all years in range are present
    all_years = range(start_year, end_year + 1)
    pivot = pivot.reindex(columns=all_years, fill_value=0)
    
    return pivot.values, pivot.index.tolist(), list(all_years)

def normalize_matrix(matrix, method="log"):
    """
    Normalize or log-scale counts.
    """
    if method == "log":
        return np.log1p(matrix)
    return matrix
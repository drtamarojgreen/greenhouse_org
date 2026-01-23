import pandas as pd
import numpy as np

def build_term_year_matrix(df, year_range):
    start_year, end_year = year_range
    df = df[(df['year'] >= start_year) & (df['year'] <= end_year)]
    pivot = df.pivot_table(index='term', columns='year', values='count', fill_value=0)
    all_years = range(start_year, end_year + 1)
    pivot = pivot.reindex(columns=all_years, fill_value=0)
    return pivot.values, pivot.index.tolist(), list(all_years)

def normalize_matrix(matrix, method="log"):
    if method == "log":
        return np.log1p(matrix)
    return matrix

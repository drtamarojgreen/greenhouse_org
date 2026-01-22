import pandas as pd

def filter_by_year_presence(df, min_years):
    """
    Remove terms that appear in fewer than min_years.
    Assumes df has columns 'term', 'year', 'count'.
    """
    term_counts = df.groupby('term')['year'].nunique()
    valid_terms = term_counts[term_counts >= min_years].index
    return df[df['term'].isin(valid_terms)]

def filter_by_total_frequency(df, min_count):
    """
    Remove terms with total count less than min_count.
    """
    term_sums = df.groupby('term')['count'].sum()
    valid_terms = term_sums[term_sums >= min_count].index
    return df[df['term'].isin(valid_terms)]

def filter_by_variance(df, min_variance):
    """
    Remove temporally flat terms (low variance).
    This might require pivoting first or grouping.
    For simplicity here, we assume we calculate variance on counts.
    """
    term_vars = df.groupby('term')['count'].var()
    valid_terms = term_vars[term_vars >= min_variance].index
    return df[df['term'].isin(valid_terms)]

def prune_terms(df, config):
    """
    Apply all pruning filters based on config.
    """
    initial_count = df['term'].nunique()
    
    df = filter_by_year_presence(df, config['dataset']['min_years_present'])
    df = filter_by_total_frequency(df, config['dataset']['min_total_count'])
    # Variance filtering usually happens after vectorization or on pivot, 
    # but can be done here if 'count' is normalized.
    
    return df
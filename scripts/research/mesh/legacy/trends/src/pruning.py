import pandas as pd

def filter_by_year_presence(df, min_years):
    term_counts = df.groupby('term')['year'].nunique()
    valid_terms = term_counts[term_counts >= min_years].index
    return df[df['term'].isin(valid_terms)]

def filter_by_total_frequency(df, min_count):
    term_sums = df.groupby('term')['count'].sum()
    valid_terms = term_sums[term_sums >= min_count].index
    return df[df['term'].isin(valid_terms)]

def filter_by_variance(df, min_variance):
    term_vars = df.groupby('term')['count'].var()
    valid_terms = term_vars[term_vars >= min_variance].index
    return df[df['term'].isin(valid_terms)]

def prune_terms(df, config):
    df = filter_by_year_presence(df, config['dataset']['min_years_present'])
    df = filter_by_total_frequency(df, config['dataset']['min_total_count'])
    if 'min_variance' in config['dataset']:
        df = filter_by_variance(df, config['dataset']['min_variance'])
    return df

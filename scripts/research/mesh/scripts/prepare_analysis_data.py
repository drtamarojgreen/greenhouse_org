import pandas as pd
import json
import os

def prepare_data(time_series_path, curated_terms_path, output_path):
    df = pd.read_csv(time_series_path)
    with open(curated_terms_path, 'r') as f:
        name_map = json.load(f)

    df['term'] = df['ui'].map(name_map)
    df = df.dropna(subset=['term'])
    df = df[['term', 'year', 'count']]

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Prepared data for discovery pipelines at {output_path}")

if __name__ == "__main__":
    prepare_data("data/output/full_time_series.csv",
                 "data/output/curated_terms.json",
                 "scripts/research/mesh/terms/data/raw/mesh_year_counts.csv")
    prepare_data("data/output/full_time_series.csv",
                 "data/output/curated_terms.json",
                 "scripts/research/mesh/trends/data/raw/mesh_year_counts.csv")

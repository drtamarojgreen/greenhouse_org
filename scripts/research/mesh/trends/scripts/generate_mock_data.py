import pandas as pd
import numpy as np
import os

def generate_mock_data(output_path, n_terms=500, start_year=1965, end_year=2024):
    years = np.arange(start_year, end_year + 1)
    data = []

    # Mental health related terms (Growth)
    mh_terms = ["Depressive Disorder", "Anxiety Disorders", "Mental Health", "Psychology, Applied", "Telemedicine"]
    for term in mh_terms:
        mid_year = np.random.randint(1990, 2010)
        growth_rate = np.random.uniform(0.1, 0.3)
        counts = 1000 / (1 + np.exp(-growth_rate * (years - mid_year)))
        counts += np.random.normal(0, 50, len(years))
        counts = np.maximum(0, counts).astype(int)
        for y, c in zip(years, counts):
            data.append({'term': term, 'year': y, 'count': c})

    # Random noise terms
    for i in range(n_terms):
        term = f"Term_{i}"
        peak = np.random.randint(start_year, end_year)
        counts = 200 * np.exp(-(years - peak)**2 / (2 * 10**2))
        counts = np.maximum(0, counts).astype(int)
        for y, c in zip(years, counts):
            data.append({'term': term, 'year': y, 'count': c})

    df = pd.DataFrame(data)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Mock data generated at {output_path}")

if __name__ == "__main__":
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    output_path = os.path.join(base_dir, "data/raw/mesh_year_counts.csv")
    generate_mock_data(output_path)

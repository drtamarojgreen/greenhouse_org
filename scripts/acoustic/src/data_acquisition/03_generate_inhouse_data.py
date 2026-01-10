# scripts/acoustic/src/data_acquisition/03_generate_inhouse_data.py

import os
import pandas as pd
import numpy as np

def generate_inhouse_data():
    """
    Placeholder function to generate the in-house dataset.
    This simulates creating data based on frequency signals from classical music
    and assessing human reaction.
    """
    print("Generating in-house data...")
    # Simulate generating data
    data = {
        'frequency': np.random.uniform(100, 1000, 100),
        'amplitude': np.random.uniform(0, 1, 100),
        'reaction_score': np.random.uniform(0, 10, 100)
    }
    df = pd.DataFrame(data)

    output_dir = "scripts/acoustic/data"
    os.makedirs(output_dir, exist_ok=True)
    df.to_csv(os.path.join(output_dir, "inhouse_data.csv"), index=False)
    print("In-house data saved to scripts/acoustic/data/inhouse_data.csv")

if __name__ == "__main__":
    generate_inhouse_data()

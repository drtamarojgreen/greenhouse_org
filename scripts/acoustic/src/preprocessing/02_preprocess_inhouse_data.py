# scripts/acoustic/src/preprocessing/02_preprocess_inhouse_data.py

import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import os

def cap_outliers(series):
    """Caps outliers in a pandas Series using the IQR method."""
    q1 = series.quantile(0.25)
    q3 = series.quantile(0.75)
    iqr = q3 - q1
    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr
    return series.clip(lower=lower_bound, upper=upper_bound)

def preprocess_inhouse_data():
    """
    Preprocesses the in-house dataset by capping outliers and normalizing the data.
    """
    print("Preprocessing in-house data with outlier handling and normalization...")

    # Define file paths
    input_file = "scripts/acoustic/data/inhouse_data.csv"
    output_file = "scripts/acoustic/data/inhouse_data_processed.csv"

    # Load data
    try:
        df = pd.read_csv(input_file)
    except FileNotFoundError:
        print("In-house data file not found. Please run the data acquisition scripts first.")
        return

    # Identify numerical columns for processing (excluding 'mode')
    cols_to_process = [col for col in df.columns if col != 'mode']

    # Apply outlier capping
    for col in cols_to_process:
        df[col] = cap_outliers(df[col])

    # Apply Min-Max normalization
    scaler = MinMaxScaler()
    df[cols_to_process] = scaler.fit_transform(df[cols_to_process])

    # Save processed data
    output_dir = "scripts/acoustic/data"
    os.makedirs(output_dir, exist_ok=True)
    df.to_csv(output_file, index=False)

    print(f"In-house data preprocessed and saved to {output_file}")

if __name__ == "__main__":
    preprocess_inhouse_data()

# scripts/acoustic/src/preprocessing/02_preprocess_inhouse_data.py

import pandas as pd
from sklearn.preprocessing import MinMaxScaler
import os

def preprocess_inhouse_music_data():
    """
    Preprocesses the in-house music dataset by encoding categorical features
    and normalizing numerical features.
    """
    print("Preprocessing in-house music data...")

    # Define file paths
    input_file = "scripts/acoustic/data/inhouse_music_data.csv"
    output_file = "scripts/acoustic/data/inhouse_music_data_processed.csv"

    # Load data
    try:
        df = pd.read_csv(input_file)
    except FileNotFoundError:
        print("In-house music data file not found. Please run the data acquisition script first.")
        return

    # --- Preprocessing ---

    # One-hot encode categorical features
    df = pd.get_dummies(df, columns=['key', 'time_signature'], drop_first=True)

    # Normalize numerical features
    numerical_cols = ['min_frequency', 'max_frequency']
    scaler = MinMaxScaler()
    df[numerical_cols] = scaler.fit_transform(df[numerical_cols])

    # Drop the title column as it's not a feature for the model
    df = df.drop('piece_title', axis=1)

    # Save processed data
    output_dir = "scripts/acoustic/data"
    os.makedirs(output_dir, exist_ok=True)
    df.to_csv(output_file, index=False)

    print(f"In-house music data preprocessed and saved to {output_file}")

if __name__ == "__main__":
    preprocess_inhouse_music_data()

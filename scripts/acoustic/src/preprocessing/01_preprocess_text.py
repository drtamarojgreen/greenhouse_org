# scripts/acoustic/src/preprocessing/01_preprocess_text.py

import pandas as pd
import re
import os

def preprocess_text_data():
    """
    Placeholder function to preprocess text data from PubMed and clinical trials.
    In a real implementation, this would involve more sophisticated NLP techniques.
    """
    print("Preprocessing text data...")

    # Load data
    try:
        pubmed_df = pd.read_csv("scripts/acoustic/data/pubmed_data.csv")
        trials_df = pd.read_csv("scripts/acoustic/data/clinical_trials_data.csv")
    except FileNotFoundError:
        print("Data files not found. Please run the data acquisition scripts first.")
        return

    # Simple text cleaning
    def clean_text(text):
        text = text.lower()
        text = re.sub(r'\[.*?\]', '', text)
        text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
        return text

    pubmed_df['cleaned_abstract'] = pubmed_df['abstract'].apply(clean_text)
    trials_df['cleaned_summary'] = trials_df['summary'].apply(clean_text)

    # Save processed data
    output_dir = "scripts/acoustic/data"
    os.makedirs(output_dir, exist_ok=True)
    pubmed_df.to_csv(os.path.join(output_dir, "pubmed_data_processed.csv"), index=False)
    trials_df.to_csv(os.path.join(output_dir, "clinical_trials_data_processed.csv"), index=False)

    print("Text data preprocessed and saved.")

if __name__ == "__main__":
    preprocess_text_data()

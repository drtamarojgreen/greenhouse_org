# scripts/acoustic/src/analysis/01_search_public_research.py

import pandas as pd
import joblib
import os

def search_public_research():
    """
    Placeholder function to search public research based on the in-house model's findings.
    """
    print("Searching public research...")

    # Load the trained model
    try:
        model = joblib.load("scripts/acoustic/src/modeling/inhouse_model.pkl")
    except FileNotFoundError:
        print("Trained model not found. Please run the model training script first.")
        return

    # Load preprocessed public research data
    try:
        pubmed_df = pd.read_csv("scripts/acoustic/data/pubmed_data_processed.csv")
    except FileNotFoundError:
        print("Preprocessed PubMed data not found. Please run the preprocessing scripts first.")
        return

    # Simulate a search based on model insights (e.g., specific frequency ranges)
    # In a real implementation, this would involve more sophisticated search criteria.
    search_keywords = ["frequency", "sound", "music", "reaction"]

    def contains_keywords(text, keywords):
        return any(keyword in text for keyword in keywords)

    pubmed_df['relevant'] = pubmed_df['cleaned_abstract'].apply(lambda x: contains_keywords(x, search_keywords))
    relevant_papers = pubmed_df[pubmed_df['relevant']]

    # Save the search results
    output_dir = "scripts/acoustic/data"
    os.makedirs(output_dir, exist_ok=True)
    relevant_papers.to_csv(os.path.join(output_dir, "relevant_pubmed_papers.csv"), index=False)

    print(f"Found {len(relevant_papers)} relevant papers. Results saved to scripts/acoustic/data/relevant_pubmed_papers.csv")

if __name__ == "__main__":
    search_public_research()

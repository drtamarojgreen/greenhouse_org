# scripts/acoustic/src/analysis/01_search_public_research.py

import pandas as pd
import joblib
import os

def search_public_research(top_n_features=3):
    """
    Searches public research data for keywords derived from the most
    important features of the in-house model.
    """
    print("Searching public research based on model insights...")

    # --- Load Model and Data ---
    try:
        model = joblib.load("scripts/acoustic/src/modeling/inhouse_model.pkl")
        pubmed_df = pd.read_csv("scripts/acoustic/data/pubmed_data_processed.csv")
        trials_df = pd.read_csv("scripts/acoustic/data/clinical_trials_data_processed.csv")
    except FileNotFoundError as e:
        print(f"Error: A required file was not found. {e}")
        print("Please ensure the preceding pipeline steps have been run.")
        return

    # --- Get Top Features from Model ---
    try:
        # The model should have feature_names_in_ if trained on a DataFrame
        feature_names = model.feature_names_in_
        importances = model.feature_importances_
    except AttributeError:
        print("Warning: Could not retrieve feature names directly from model.")
        print("Falling back to expected feature order. Ensure this is correct.")
        # Fallback for models that don't store feature names
        feature_names = ['tempo', 'mode', 'energy', 'valence', 'loudness']
        importances = model.feature_importances_

    feature_importance_df = pd.DataFrame({
        'feature': feature_names,
        'importance': importances
    }).sort_values(by='importance', ascending=False)

    top_features = feature_importance_df['feature'].head(top_n_features).tolist()
    print(f"Top {top_n_features} most important features from model: {top_features}")

    # --- Search Data for Keywords ---
    def score_relevance(text, keywords):
        if not isinstance(text, str):
            return 0
        # Score is the number of unique keywords found in the text
        score = sum(1 for keyword in keywords if keyword in text)
        return score

    pubmed_df['relevance_score'] = pubmed_df['cleaned_abstract'].apply(lambda x: score_relevance(x, top_features))
    trials_df['relevance_score'] = trials_df['cleaned_summary'].apply(lambda x: score_relevance(x, top_features))

    # Filter for relevant documents (score > 0)
    relevant_pubmed = pubmed_df[pubmed_df['relevance_score'] > 0].sort_values(by='relevance_score', ascending=False)
    relevant_trials = trials_df[trials_df['relevance_score'] > 0].sort_values(by='relevance_score', ascending=False)

    # --- Save Results ---
    output_dir = "scripts/acoustic/data"
    os.makedirs(output_dir, exist_ok=True)

    pubmed_output_path = os.path.join(output_dir, "relevant_pubmed_papers.csv")
    relevant_pubmed.to_csv(pubmed_output_path, index=False)

    trials_output_path = os.path.join(output_dir, "relevant_clinical_trials.csv")
    relevant_trials.to_csv(trials_output_path, index=False)

    print(f"Found {len(relevant_pubmed)} relevant PubMed papers. Saved to {pubmed_output_path}")
    print(f"Found {len(relevant_trials)} relevant clinical trials. Saved to {trials_output_path}")

if __name__ == "__main__":
    search_public_research()

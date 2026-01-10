# scripts/acoustic/src/analysis/02_comparative_analysis.py

import pandas as pd
import joblib
import os

def generate_analysis_report(top_n_features=5):
    """
    Generates a textual analysis report by cross-referencing model insights
    with academic research.
    """
    print("Generating textual analysis report...")

    # --- Load Model and Data ---
    try:
        model = joblib.load("scripts/acoustic/src/modeling/inhouse_model.pkl")
        pubmed_df = pd.read_csv("scripts/acoustic/data/pubmed_data_processed.csv")
        trials_df = pd.read_csv("scripts/acoustic/data/clinical_trials_data_processed.csv")
        processed_music_df = pd.read_csv("scripts/acoustic/data/inhouse_music_data_processed.csv")
    except FileNotFoundError as e:
        print(f"Error: A required file was not found. {e}")
        return

    # --- Get Top Features from Model ---
    feature_names = processed_music_df.drop('popularity_score', axis=1).columns
    importances = model.feature_importances_

    feature_importance_df = pd.DataFrame({
        'feature': feature_names,
        'importance': importances
    }).sort_values(by='importance', ascending=False)

    top_features = feature_importance_df.head(top_n_features)

    # --- Generate Report ---
    output_dir = "scripts/acoustic/analysis_results"
    os.makedirs(output_dir, exist_ok=True)
    report_path = os.path.join(output_dir, "analysis_summary.txt")

    with open(report_path, "w") as f:
        f.write("Acoustic Analysis Report\n")
        f.write("="*30 + "\n\n")

        f.write("Part 1: Key Musical Patterns Identified\n")
        f.write("----------------------------------------\n")
        f.write("The following musical features were found to be the most predictive of the simulated 'popularity score':\n\n")

        for index, row in top_features.iterrows():
            f.write(f"- {row['feature']} (Importance: {row['importance']:.4f})\n")

        f.write("\n" + "="*30 + "\n\n")

        f.write("Part 2: Cross-Reference with Academic Research\n")
        f.write("------------------------------------------------\n")
        f.write("The following academic papers and clinical trials mention concepts related to these key musical patterns:\n\n")

        for index, row in top_features.iterrows():
            # Clean up feature name for searching (e.g., 'key_G major' -> 'key g major')
            search_term = row['feature'].replace('_', ' ').lower()

            f.write(f"--- Papers mentioning '{search_term}' ---\n")

            # Search PubMed
            pubmed_hits = pubmed_df[pubmed_df['cleaned_abstract'].str.contains(search_term, na=False)]
            if not pubmed_hits.empty:
                for _, paper in pubmed_hits.iterrows():
                    f.write(f"  - [PubMed] {paper['title']}\n")

            # Search Clinical Trials
            trials_hits = trials_df[trials_df['cleaned_summary'].str.contains(search_term, na=False)]
            if not trials_hits.empty:
                for _, trial in trials_hits.iterrows():
                    f.write(f"  - [Trial] {trial['title']}\n")

            if pubmed_hits.empty and trials_hits.empty:
                f.write("  - No direct mentions found in the downloaded research.\n")

            f.write("\n")

    print(f"Analysis report generated and saved to {report_path}")

if __name__ == "__main__":
    generate_analysis_report()

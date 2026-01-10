# scripts/acoustic/src/analysis/02_comparative_analysis.py

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from collections import Counter
import os
import re

def comparative_analysis(top_n_words=20):
    """
    Performs a comparative analysis by plotting keyword frequencies from
    the relevant PubMed abstracts.
    """
    print("Performing comparative analysis by plotting keyword frequencies...")

    # --- File Paths ---
    input_file = "scripts/acoustic/data/relevant_pubmed_papers.csv"
    output_dir = "scripts/acoustic/analysis_results"
    output_plot = os.path.join(output_dir, "keyword_frequency_plot.png")

    # --- Input Validation ---
    if not os.path.exists(input_file):
        print("Relevant research data file not found. Please run the public research search script first.")
        return

    # --- Data Loading and Processing ---
    df = pd.read_csv(input_file)
    if df.empty:
        print("No relevant papers found to analyze. Skipping plot generation.")
        return

    # Tokenize and count word frequencies
    words = " ".join(df['cleaned_abstract'].dropna()).split()
    word_counts = Counter(words)

    # --- Plot Generation ---
    if not word_counts:
        print("No words to plot after processing. Skipping plot generation.")
        return

    # Create the output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    # Get the most common words
    most_common_words = word_counts.most_common(top_n_words)
    word_df = pd.DataFrame(most_common_words, columns=['word', 'count'])

    # Create and save the plot
    plt.figure(figsize=(10, 8))
    sns.barplot(x='count', y='word', data=word_df, palette='viridis')
    plt.title(f'Top {top_n_words} Keywords in Relevant PubMed Abstracts')
    plt.xlabel('Frequency')
    plt.ylabel('Keyword')
    plt.tight_layout()
    plt.savefig(output_plot)

    print(f"Comparative analysis complete. Plot saved to {output_plot}")

if __name__ == "__main__":
    comparative_analysis()

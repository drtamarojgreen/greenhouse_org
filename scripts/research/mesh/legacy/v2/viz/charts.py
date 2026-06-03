"""
Visualization generator for MeSH discovery results.
"""
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import os
from typing import List, Dict

class Visualizer:
    def __init__(self, output_dir: str = "scripts/research/mesh/v2/plots"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        sns.set_theme(style="whitegrid")

    def plot_growth_comparison(self, data: List[Dict], filename: str = "growth_comparison.png"):
        """
        Plots a bar chart comparing the volume of discovered terms.
        """
        df = pd.DataFrame(data)
        plt.figure(figsize=(12, 8))
        ax = sns.barplot(x="count", y="term", data=df.sort_values("count", ascending=False))
        ax.set_title("Publication Volume for Discovered MeSH Terms")
        plt.tight_layout()
        plt.savefig(os.path.join(self.output_dir, filename))
        plt.close()

    def plot_time_series(self, term_data: Dict[str, List[int]], years: List[int], filename: str = "time_series.png"):
        """
        Plots a line chart with multiple time series (Sparkline-style integration).
        """
        plt.figure(figsize=(14, 7))
        for term, counts in term_data.items():
            plt.plot(years, counts, label=term, alpha=0.7)

        plt.title("Longitudinal Research Trends")
        plt.xlabel("Year")
        plt.ylabel("Publication Count")
        plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
        plt.tight_layout()
        plt.savefig(os.path.join(self.output_dir, filename))
        plt.close()

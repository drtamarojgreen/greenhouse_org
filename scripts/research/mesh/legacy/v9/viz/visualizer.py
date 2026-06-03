"""
MeSH Discovery Suite V9 - Visualizer
Publication-ready charts for timelines, growth, networks, and trial phases.
"""
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import networkx as nx
import os
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class VisualizerV9:
    """
    Advanced Visualization Engine (v9).
    """
    def __init__(self, config: Dict):
        self.config = config.get("viz", {})
        self.output_dir = config.get("output", {}).get("base_dir", "scripts/research/mesh/v9/output")
        os.makedirs(self.output_dir, exist_ok=True)

        # Set publication-ready style
        sns.set_theme(style="whitegrid")
        plt.rcParams.update({
            'figure.figsize': (12, 8),
            'font.size': 12,
            'axes.titlesize': 16,
            'axes.labelsize': 14,
            'savefig.dpi': 300
        })

    def plot_timeline(self, temporal_data: Dict[str, Any], normalize: bool = True):
        """
        Plots multi-condition line chart of publication counts over time.
        """
        plt.figure()
        intervals = temporal_data["intervals"]

        for dataset in temporal_data["datasets"]:
            label = dataset["label"]
            counts = dataset["normalized_counts"] if normalize and "normalized_counts" in dataset else dataset["counts"]
            plt.plot(intervals, counts, marker='o', label=label)

        plt.title(f"Publication Trends (Normalized: {normalize})")
        plt.xlabel("Interval")
        plt.ylabel("Count per 10k PubMed Articles" if normalize else "Raw Count")
        plt.xticks(rotation=45)
        plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
        plt.tight_layout()

        suffix = "normalized" if normalize else "raw"
        plt.savefig(os.path.join(self.output_dir, f"timeline_v9_{suffix}.png"))
        plt.savefig(os.path.join(self.output_dir, f"timeline_v9_{suffix}.svg"))
        plt.close()

    def plot_growth_comparison(self, results_df: pd.DataFrame):
        """
        Horizontal bar chart sorted by momentum score.
        """
        plt.figure(figsize=(10, min(12, len(results_df) * 0.4 + 2)))
        top_df = results_df.head(20) # Top 20 for readability

        sns.barplot(data=top_df, x="Momentum", y="Term", palette="viridis")

        plt.title("Top Research Momentum Scores")
        plt.xlabel("Momentum Score (0-100)")
        plt.ylabel("MeSH Term")
        plt.tight_layout()

        plt.savefig(os.path.join(self.output_dir, "growth_comparison_v9.png"))
        plt.savefig(os.path.join(self.output_dir, "growth_comparison_v9.svg"))
        plt.close()

    def plot_network(self, G: nx.Graph):
        """
        Plots NetworkX graph with node size = PageRank.
        """
        if G.number_of_nodes() == 0: return

        plt.figure(figsize=(14, 14))
        pos = nx.spring_layout(G, k=0.15, iterations=20)

        # Node sizes based on pagerank
        pagerank = nx.pagerank(G, weight='weight')
        node_sizes = [pagerank[node] * 10000 for node in G.nodes()]

        # Colors based on group
        groups = nx.get_node_attributes(G, 'group')
        unique_groups = list(set(groups.values()))
        color_map = plt.cm.get_cmap('tab10', len(unique_groups))
        group_to_color = {g: color_map(i) for i, g in enumerate(unique_groups)}
        node_colors = [group_to_color[groups[node]] for node in G.nodes()]

        nx.draw_networkx_nodes(G, pos, node_size=node_sizes, node_color=node_colors, alpha=0.7)
        nx.draw_networkx_edges(G, pos, width=0.5, edge_color='gray', alpha=0.3)

        # Labels for top 20 pagerank nodes
        top_nodes = sorted(pagerank, key=pagerank.get, reverse=True)[:20]
        labels = {node: G.nodes[node].get('label', node) for node in top_nodes}
        nx.draw_networkx_labels(G, pos, labels, font_size=10)

        plt.title("MeSH Discovery Knowledge Graph")
        plt.axis('off')
        plt.tight_layout()

        plt.savefig(os.path.join(self.output_dir, "network_v9.png"))
        plt.close()

    def plot_trial_phases(self, phase_data: Dict[str, Dict[str, int]]):
        """
        Stacked bar chart of Phase I/II/III/IV distribution.
        """
        df = pd.DataFrame(phase_data).T
        # Reorder columns
        cols = ["PHASE1", "PHASE2", "PHASE3", "PHASE4", "NA"]
        df = df[[c for c in cols if c in df.columns]]

        df.plot(kind='bar', stacked=True, colormap='Spectral')
        plt.title("Clinical Trial Phase Distribution")
        plt.xlabel("Condition")
        plt.ylabel("Number of Trials")
        plt.xticks(rotation=45)
        plt.legend(title="Phase")
        plt.tight_layout()

        plt.savefig(os.path.join(self.output_dir, "trial_phases_v9.png"))
        plt.close()

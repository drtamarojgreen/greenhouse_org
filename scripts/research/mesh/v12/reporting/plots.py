import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import networkx as nx
import os
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class NativeVisualizer:
    """Natively ported visualizer for v12, supports all chart types from v2 through v9."""
    def __init__(self, output_dir: str = "scripts/research/mesh/v12/plots"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        sns.set_theme(style="whitegrid")
        plt.rcParams.update({
            'figure.figsize': (12, 8),
            'font.size': 12,
            'axes.titlesize': 16,
            'axes.labelsize': 14,
            'savefig.dpi': 300
        })

    def plot_growth_comparison(self, data: List[Dict], filename: str = "growth_comparison.png"):
        """Bar chart of publication volumes (v2 style)."""
        df = pd.DataFrame(data)
        if "count" not in df.columns:
            return
        plt.figure(figsize=(12, 8))
        ax = sns.barplot(x="count", y="term", data=df.sort_values("count", ascending=False))
        ax.set_title("Publication Volume for Discovered MeSH Terms")
        plt.tight_layout()
        plt.savefig(os.path.join(self.output_dir, filename))
        plt.close()

    def plot_time_series(self, term_data: Dict[str, List[int]], years: List[int], filename: str = "time_series.png"):
        """Multi-condition line chart (v2/v5 style)."""
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

    def plot_timeline(self, temporal_data: Dict[str, Any], normalize: bool = True, filename: str = "timeline.png"):
        """Multi-condition timeline (v9 style)."""
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
        plt.savefig(os.path.join(self.output_dir, filename))
        plt.close()

    def plot_momentum(self, results_df: pd.DataFrame, filename: str = "momentum.png"):
        """Horizontal bar chart sorted by momentum score (v9 style)."""
        plt.figure(figsize=(10, min(12, len(results_df) * 0.4 + 2)))
        top_df = results_df.head(20)
        sns.barplot(data=top_df, x="Momentum", y="Term", palette="viridis")
        plt.title("Top Research Momentum Scores")
        plt.xlabel("Momentum Score (0-100)")
        plt.ylabel("MeSH Term")
        plt.tight_layout()
        plt.savefig(os.path.join(self.output_dir, filename))
        plt.close()

    def plot_network(self, G: nx.Graph, filename: str = "network.png"):
        """NetworkX graph plot (v9 style)."""
        if G.number_of_nodes() == 0:
            return
        plt.figure(figsize=(14, 14))
        pos = nx.spring_layout(G, k=0.15, iterations=20)
        pagerank = nx.pagerank(G, weight='weight')
        node_sizes = [pagerank[node] * 10000 for node in G.nodes()]
        groups = nx.get_node_attributes(G, 'group')
        unique_groups = list(set(groups.values()))
        color_map = plt.cm.get_cmap('tab10', max(len(unique_groups), 1))
        group_to_color = {g: color_map(i) for i, g in enumerate(unique_groups)}
        node_colors = [group_to_color.get(groups.get(node, ""), (0.5, 0.5, 0.5, 1)) for node in G.nodes()]
        nx.draw_networkx_nodes(G, pos, node_size=node_sizes, node_color=node_colors, alpha=0.7)
        nx.draw_networkx_edges(G, pos, width=0.5, edge_color='gray', alpha=0.3)
        top_nodes = sorted(pagerank, key=pagerank.get, reverse=True)[:20]
        labels = {node: G.nodes[node].get('label', node) for node in top_nodes}
        nx.draw_networkx_labels(G, pos, labels, font_size=10)
        plt.title("MeSH Discovery Knowledge Graph")
        plt.axis('off')
        plt.tight_layout()
        plt.savefig(os.path.join(self.output_dir, filename))
        plt.close()

    def plot_trial_phases(self, phase_data: Dict[str, Dict[str, int]], filename: str = "trial_phases.png"):
        """Stacked bar chart of trial phase distribution (v9 style)."""
        df = pd.DataFrame(phase_data).T
        cols = ["PHASE1", "PHASE2", "PHASE3", "PHASE4", "NA"]
        df = df[[c for c in cols if c in df.columns]]
        df.plot(kind='bar', stacked=True, colormap='Spectral')
        plt.title("Clinical Trial Phase Distribution")
        plt.xlabel("Condition")
        plt.ylabel("Number of Trials")
        plt.xticks(rotation=45)
        plt.legend(title="Phase")
        plt.tight_layout()
        plt.savefig(os.path.join(self.output_dir, filename))
        plt.close()

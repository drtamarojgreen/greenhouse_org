"""
MeSH Discovery Suite V3 - Visualizer
Advanced visualization for MeSH discovery results and relationships.
"""
import logging
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os
from typing import List, Dict

try:
    import plotly.express as px
    import plotly.graph_objects as go
    HAS_PLOTLY = True
except ImportError:
    HAS_PLOTLY = False

try:
    import networkx as nx
    HAS_NETWORKX = True
except ImportError:
    HAS_NETWORKX = False

logger = logging.getLogger(__name__)

class VisualizerV3:
    """
    Advanced visualizer for MeSH discovery results.
    """
    def __init__(self, output_dir: str = "scripts/research/mesh/v3/viz_output"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)

    def plot_growth_comparison(self, results: List[Dict]):
        """
        Plots publication volume comparison.
        """
        df = pd.DataFrame(results)
        if df.empty: return

        plt.figure(figsize=(12, 6))
        sns.barplot(data=df.sort_values('count', ascending=False).head(15), x='count', y='term')
        plt.title("Top Discovered MeSH Terms by Volume")
        plt.tight_layout()
        plt.savefig(os.path.join(self.output_dir, "growth_comparison.png"))
        plt.close()

    def plot_sunburst(self, hierarchy_df: pd.DataFrame):
        """
        Enhancement 62: Hierarchical Sunburst chart for visualizing the discovered MeSH tree structure.
        """
        if not HAS_PLOTLY or hierarchy_df.empty:
            logger.warning("Plotly not available or empty hierarchy data.")
            return

        try:
            fig = px.sunburst(hierarchy_df, path=['parent', 'term'], values='count',
                              title="MeSH Discovery: Hierarchical Sunburst")
            fig.write_html(os.path.join(self.output_dir, "sunburst.html"))
        except Exception as e:
            logger.error(f"Sunburst plot failed: {e}")

    def plot_cooccurrence_network(self, matrix: pd.DataFrame):
        """
        Enhancement 63: Network Graph of co-occurring terms in the theme using NetworkX.
        """
        if not HAS_NETWORKX or matrix.empty:
            logger.warning("NetworkX not available or empty matrix.")
            return

        try:
            G = nx.from_pandas_adjacency(matrix)
            plt.figure(figsize=(10, 10))
            pos = nx.spring_layout(G, k=0.15, iterations=20)
            nx.draw_networkx_nodes(G, pos, node_size=500, node_color='skyblue', alpha=0.8)
            nx.draw_networkx_edges(G, pos, width=1.0, alpha=0.5)
            nx.draw_networkx_labels(G, pos, font_size=8)

            plt.title("MeSH Term Co-occurrence Network")
            plt.axis('off')
            plt.savefig(os.path.join(self.output_dir, "network_graph.png"))
            plt.close()
        except Exception as e:
            logger.error(f"Network graph failed: {e}")

    def plot_time_series_heatmap(self, time_data: pd.DataFrame):
        """
        Enhancement 64: Time-Series Heatmap for term popularity across different periods.
        """
        plt.figure(figsize=(14, 8))
        sns.heatmap(time_data, cmap="YlGnBu", annot=False)
        plt.title("Term Popularity Time-Series Heatmap")
        plt.savefig(os.path.join(self.output_dir, "time_series_heatmap.png"))
        plt.close()

    def generate_interactive_dashboard(self, results: List[Dict]):
        """
        Enhancement 71: Dashboard layout for multi-theme comparison.
        (Placeholder for Streamlit or Plotly Dash logic)
        """
        if HAS_PLOTLY:
            # Conceptually, create a combined figure or export to a template
            pass

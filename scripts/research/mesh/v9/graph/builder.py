"""
MeSH Discovery Suite V9 - Graph Builder
Constructs knowledge graphs from discovery and trial results with centrality analysis.
"""
import csv
import json
import os
import logging
import networkx as nx
from typing import List, Dict, Any, Set, Tuple

logger = logging.getLogger(__name__)

class GraphBuilderV9:
    """
    Advanced Knowledge Graph Builder (v9).
    """
    def __init__(self, config: Dict):
        self.config = config.get("graph", {})
        self.nodes = {} # id -> props
        self.edges = set() # (source, target, weight)
        self.G = nx.DiGraph()

    def add_node(self, node_id: str, label: str, group: str, weight: float = 1.0):
        if node_id not in self.nodes:
            self.nodes[node_id] = {
                "label": label,
                "group": group,
                "weight": weight
            }
        else:
            self.nodes[node_id]["weight"] += weight

        self.G.add_node(node_id, label=label, group=group, weight=self.nodes[node_id]["weight"])

    def add_edge(self, source: str, target: str, weight: float = 1.0):
        if source == target: return
        self.edges.add((source, target, weight))
        self.G.add_edge(source, target, weight=weight)

    def build_from_discovery(self, discovery_results: List[Dict], trial_results: Dict[str, List[Dict]]):
        """
        Populates nodes and edges from discovery and clinical trial results.
        """
        # Add MeSH nodes from discovery
        for res in discovery_results:
            term = res["term"]
            term_id = f"MESH_{term.upper().replace(' ', '_')}"
            self.add_node(term_id, term, "MeSHTerm", weight=res.get("count", 1) / 1000.0)

            # If we have trial data for this term
            if term in trial_results:
                for trial in trial_results[term]:
                    nct_id = trial["nct_id"]
                    self.add_node(nct_id, trial["title"][:50], "ClinicalTrial", weight=2.0)
                    self.add_edge(term_id, nct_id, weight=1.0)

                    for intervention in trial.get("interventions", []):
                        int_id = f"INT_{intervention.upper().replace(' ', '_')}"
                        self.add_node(int_id, intervention, "Intervention", weight=1.0)
                        self.add_edge(nct_id, int_id, weight=1.0)

    def analyze(self) -> Dict[str, Any]:
        """
        Runs NetworkX centrality analysis.
        """
        if self.G.number_of_nodes() == 0:
            return {}

        centrality = {
            "degree": nx.degree_centrality(self.G),
            "betweenness": nx.betweenness_centrality(self.G),
            "pagerank": nx.pagerank(self.G, weight='weight')
        }

        # Attach metrics to nodes
        for node_id in self.nodes:
            self.nodes[node_id]["degree_centrality"] = round(centrality["degree"].get(node_id, 0), 4)
            self.nodes[node_id]["betweenness_centrality"] = round(centrality["betweenness"].get(node_id, 0), 4)
            self.nodes[node_id]["pagerank"] = round(centrality["pagerank"].get(node_id, 0), 4)

        return centrality

    def export_csv(self, filepath: str):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=["NodeID", "Label", "Group", "Weight", "PageRank", "Connections"])
            writer.writeheader()
            for node_id, props in self.nodes.items():
                connections = [target for src, target, w in self.edges if src == node_id]
                writer.writerow({
                    "NodeID": node_id,
                    "Label": props["label"],
                    "Group": props["group"],
                    "Weight": round(props["weight"], 2),
                    "PageRank": props.get("pagerank", 0),
                    "Connections": json.dumps(connections)
                })

    def export_json(self, filepath: str):
        """
        Exports to Cytoscape-compatible JSON format.
        """
        elements = {"nodes": [], "edges": []}
        for node_id, props in self.nodes.items():
            elements["nodes"].append({
                "data": {
                    "id": node_id,
                    "label": props["label"],
                    "group": props["group"],
                    "weight": props["weight"],
                    "pagerank": props.get("pagerank", 0)
                }
            })

        for source, target, weight in self.edges:
            elements["edges"].append({
                "data": {
                    "source": source,
                    "target": target,
                    "weight": weight
                }
            })

        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'w') as f:
            json.dump(elements, f, indent=2)

    def get_top_nodes(self, limit: int = 50, metric: str = "pagerank") -> List[Dict]:
        sorted_nodes = sorted(
            [{"id": k, **v} for k, v in self.nodes.items()],
            key=lambda x: x.get(metric, 0),
            reverse=True
        )
        return sorted_nodes[:limit]

import csv
import json
import os
from typing import List, Dict, Any

class GraphBuilder:
    """
    Builds a graph structure and exports it to graph.csv.
    """
    def __init__(self):
        self.nodes = {} # NodeID -> Node properties

    def add_node(self, node_id: str, label: str, group: str, weight: float = 1.0):
        if node_id not in self.nodes:
            self.nodes[node_id] = {
                "NodeLabel": label,
                "NodeID": node_id,
                "Connections": set(),
                "Weight": weight,
                "Group": group
            }
        else:
            self.nodes[node_id]["Weight"] += weight

    def add_edge(self, source_id: str, target_id: str):
        if source_id in self.nodes and target_id in self.nodes:
            self.nodes[source_id]["Connections"].add(target_id)
            self.nodes[target_id]["Connections"].add(source_id)

    def build_from_data(self, disorder_name: str, drug_data: List[Dict], trial_data: List[Dict], article_data: List[Dict]):
        """
        Populates nodes and edges from raw data.
        """
        disorder_id = f"DISORDER_{disorder_name.upper().replace(' ', '_')}"
        self.add_node(disorder_id, disorder_name, "Disorder", weight=10.0)

        for drug in drug_data:
            drug_id = f"DRUG_{drug['id']}" if drug.get('id') else f"DRUG_{drug['name'].upper().replace(' ', '_')}"
            self.add_node(drug_id, drug['name'], "Drug", weight=5.0)
            self.add_edge(disorder_id, drug_id)

        for trial in trial_data:
            trial_id = trial['nct_id']
            if not trial_id: continue
            self.add_node(trial_id, trial['title'][:50] + "...", "ClinicalTrial", weight=3.0)
            self.add_edge(disorder_id, trial_id)

            for intervention in trial.get('interventions', []):
                intervention_id = f"INTERVENTION_{intervention.upper().replace(' ', '_')}"
                self.add_node(intervention_id, intervention, "Intervention", weight=2.0)
                self.add_edge(trial_id, intervention_id)

        for article in article_data:
            article_id = f"PMID:{article['pmid']}"
            self.add_node(article_id, article['title'][:50] + "...", "PubMedArticle", weight=2.0)
            self.add_edge(disorder_id, article_id)

            for author in article.get('authors', []):
                author_id = f"AUTHOR_{author.upper().replace(' ', '_')}"
                self.add_node(author_id, author, "Author", weight=1.0)
                self.add_edge(article_id, author_id)

    def export_to_csv(self, filepath: str):
        cache_dir = os.path.dirname(filepath)
        if cache_dir:
            os.makedirs(cache_dir, exist_ok=True)
        with open(filepath, 'w', newline='') as csvfile:
            fieldnames = ['NodeLabel', 'NodeID', 'Connections', 'Weight', 'Group']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            for node_id, props in self.nodes.items():
                row = props.copy()
                row['Connections'] = json.dumps(list(props['Connections']))
                writer.writerow(row)

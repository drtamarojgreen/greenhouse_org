import csv
import json
import logging
import asyncio
import aiohttp
from typing import List, Dict, Any
from .api_clients import DiscoveryClientV6

logger = logging.getLogger(__name__)

class DiscoveryEngineV6:
    """
    Engine to process graph CSV and fetch discovery data for top nodes.
    """
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.client = DiscoveryClientV6(cache_db=config.get("cache_db", "scripts/research/mesh/v6/cache.db"))
        self.semaphore = asyncio.Semaphore(config.get("max_concurrency", 5))

    def parse_graph_csv(self, csv_path: str) -> List[Dict[str, Any]]:
        """
        Parses the graph.csv using the csv module.
        Expected format: "Label",ID,[Connections],Weight,Group
        """
        nodes = []
        try:
            with open(csv_path, 'r', encoding='utf-8') as f:
                # Custom reader to handle the specific format
                reader = csv.reader(f)
                for row in reader:
                    if not row or len(row) < 4:
                        continue
                    try:
                        label = row[0].strip()
                        # If label starts and ends with quotes, strip them (csv.reader might already do this)
                        if label.startswith('"') and label.endswith('"'):
                            label = label[1:-1]

                        node_id = row[1].strip()
                        connections_str = row[2].strip()
                        weight = int(row[3].strip())

                        # Calculate num_edges
                        num_edges = 0
                        if connections_str.startswith('[') and connections_str.endswith(']'):
                             try:
                                 # Basic parsing of [1,2,3]
                                 conn_list = connections_str[1:-1].split(',')
                                 num_edges = len([c for c in conn_list if c.strip()])
                             except:
                                 pass

                        composite_score = num_edges + weight
                        nodes.append({
                            "name": label,
                            "id": node_id,
                            "weight": weight,
                            "num_edges": num_edges,
                            "composite_score": composite_score
                        })
                    except (ValueError, IndexError) as e:
                        logger.warning(f"Skipping malformed row {row}: {e}")
        except FileNotFoundError:
            logger.error(f"Graph CSV not found at {csv_path}")
        except Exception as e:
            logger.error(f"Error parsing CSV {csv_path}: {e}")

        return nodes

    async def process_node(self, session: aiohttp.ClientSession, node_name: str) -> Dict[str, Any]:
        """
        Fetches all discovery data for a single node.
        """
        async with self.semaphore:
            logger.info(f"Processing node: {node_name}")
            pubmed_task = self.client.get_pubmed_data(session, node_name)
            ct_task = self.client.get_clinical_trials_data(session, node_name)
            fda_task = self.client.get_fda_drugs_data(session, node_name)

            pubmed_data, ct_data, fda_data = await asyncio.gather(pubmed_task, ct_task, fda_task)

            return {
                "node_name": node_name,
                "pubmed_data": pubmed_data,
                "clinical_trials_data": ct_data,
                "fda_drugs_data": fda_data
            }

    async def run(self, csv_path: str, num_nodes: int, output_path: str):
        """
        Executes the discovery pipeline.
        """
        all_nodes = self.parse_graph_csv(csv_path)
        # Sort by composite score (descending), then by weight (descending)
        sorted_nodes = sorted(all_nodes, key=lambda x: (x['composite_score'], x['weight']), reverse=True)

        top_nodes = []
        seen_names = set()
        for node in sorted_nodes:
            if node['name'] not in seen_names:
                top_nodes.append(node['name'])
                seen_names.add(node['name'])
            if len(top_nodes) >= num_nodes:
                break

        if not top_nodes:
            logger.warning("No nodes found to process.")
            return []

        logger.info(f"Identified {len(top_nodes)} top nodes for discovery.")

        async with aiohttp.ClientSession() as session:
            tasks = [self.process_node(session, name) for name in top_nodes]
            results = await asyncio.gather(*tasks)

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2)

        logger.info(f"Discovery results saved to {output_path}")
        return results

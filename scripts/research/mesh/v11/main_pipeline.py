import os
import json
import csv
import logging
from pathlib import Path
from typing import List, Dict

from .utils import get_cache_connection, rate_limited
from .pubmed_tree import build_pubmed_tree
from .reactome_mapper import map_to_reactome_pathways
from tqdm import tqdm

# Configure logging
logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

def load_config(config_path: str = None) -> Dict:
    import yaml
    # Resolve config.yaml relative to this file if no explicit path is given
    if config_path is None:
        config_path = os.path.join(os.path.dirname(__file__), "config.yaml")
    with open(config_path, "r") as f:
        cfg = yaml.safe_load(f)
    return cfg

def ensure_output_dir(path: str):
    Path(path).mkdir(parents=True, exist_ok=True)

def write_json(data: Dict, out_path: str):
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def write_csv(rows: List[Dict], out_path: str):
    if not rows:
        return
    fieldnames = rows[0].keys()
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

def main():
    cfg = load_config()
    disorder = cfg["pipeline"]["disorder"]
    interventions = cfg["pipeline"].get("interventions", [])
    output_cfg = cfg["output"]
    output_dir = output_cfg["json_path"].rsplit("/", 1)[0]
    ensure_output_dir(output_dir)
    # Reset cache DB to ensure it matches the updated schema
    cache_path = cfg["cache"]["db_path"]
    if os.path.exists(cache_path):
        os.remove(cache_path)
    cache_conn = get_cache_connection(cache_path)

    results = {}
    flat_rows = []
    for intervention in tqdm(interventions, desc="Processing interventions"):
        logger.info(f"Processing intervention: {intervention}")
        tree = build_pubmed_tree(disorder, intervention)
        pathways = map_to_reactome_pathways(tree, cfg["reactome"]["graphql_endpoint"])
        results[intervention] = {
            "tree": tree,
            "pathways": pathways,
        }
        # Flatten for CSV
        for leaf in pathways:
            for pathway in pathways[leaf]:
                flat_rows.append({
                    "disorder": disorder,
                    "intervention": intervention,
                    "mesh_term": leaf,
                    "reactome_pathway_id": pathway["stId"],
                    "reactome_pathway_name": pathway["displayName"],
                })
    write_json(results, output_cfg["json_path"])
    write_csv(flat_rows, output_cfg["csv_path"])
    logger.info("Pipeline completed successfully.")

if __name__ == "__main__":
    main()

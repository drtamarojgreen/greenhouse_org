import asyncio
import argparse
import yaml
import logging
import sys
import os

# Add the project root to sys.path for relative imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../..")))

from scripts.research.mesh.v6.core.engine import DiscoveryEngineV6

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("scripts/research/mesh/v6/pipeline.log")
    ]
)
logger = logging.getLogger("MeshV6Pipeline")

async def main():
    parser = argparse.ArgumentParser(description="MeSH Discovery Suite V6 Pipeline")
    parser.add_argument("--csv_path", help="Path to the graph CSV file.")
    parser.add_argument("--num_nodes", type=int, help="Number of top nodes to process.")
    parser.add_argument("--output_file", help="Output JSON file name.")
    parser.add_argument("--config", default="scripts/research/mesh/v6/config.yaml", help="Path to config file.")

    args = parser.parse_args()

    # Load config
    if os.path.exists(args.config):
        with open(args.config, 'r') as f:
            config = yaml.safe_load(f)
    else:
        logger.warning(f"Config file not found at {args.config}, using defaults.")
        config = {}

    discovery_cfg = config.get("discovery", {})

    csv_path = args.csv_path or discovery_cfg.get("default_csv_path", "docs/endpoints/graph.csv")
    num_nodes = args.num_nodes or discovery_cfg.get("top_nodes_limit", 50)
    output_file = args.output_file or discovery_cfg.get("default_output_path", "discovery_graph_output.json")

    engine = DiscoveryEngineV6(discovery_cfg)

    logger.info("Starting V6 Discovery Pipeline...")
    await engine.run(csv_path, num_nodes, output_file)
    logger.info("V6 Discovery Pipeline complete.")

if __name__ == "__main__":
    asyncio.run(main())

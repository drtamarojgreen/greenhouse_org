import asyncio
import argparse
import sys
import os

# Add the project root to sys.path for relative imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../..")))

from scripts.research.mesh.v6.core.engine import DiscoveryEngineV6

def main():
    parser = argparse.ArgumentParser(description="Generate discovery graph data (V6 Legacy Wrapper).")
    parser.add_argument("--csv_path", default="docs/endpoints/graph.csv", help="Path to the graph CSV file.")
    parser.add_argument("--num_nodes", type=int, default=50, help="Number of top nodes to process.")
    parser.add_argument("--output_file", default="discovery_graph_output.json", help="Output JSON file name.")
    args = parser.parse_args()

    # Simple default config for legacy wrapper
    config = {
        "max_concurrency": 5,
        "cache_db": "scripts/research/mesh/v6/cache.db"
    }
    
    engine = DiscoveryEngineV6(config)

    print(f"Fetching top {args.num_nodes} nodes from {args.csv_path} (V6 Engine)...")
    asyncio.run(engine.run(args.csv_path, args.num_nodes, args.output_file))
    print("Done.")

if __name__ == "__main__":
    main()

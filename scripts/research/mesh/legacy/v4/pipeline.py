"""
MeSH Discovery Suite V4 - Main Pipeline
Orchestrates hierarchical discovery.
"""
import asyncio
import logging
import argparse
import yaml
import os
import sys

# Add the current directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.client import PubMedClientV4
from core.engine import DiscoveryEngineV4
from ui.cli import CLIV4

class MeSHPipelineV4:
    """
    Main pipeline for the MeSH Discovery Suite V4.
    """
    def __init__(self, config_path: str = None):
        self.config = self._load_config(config_path)
        self._setup_logging()

        self.cli = CLIV4()
        self.client = PubMedClientV4(
            api_keys=self.config.get('api_keys'),
            cache_db=self.config.get('cache_db', "scripts/research/mesh/v4/cache.db")
        )
        self.engine = DiscoveryEngineV4(self.client, self.config)

    def _load_config(self, path: str) -> dict:
        if path and os.path.exists(path):
            with open(path, 'r') as f:
                config = yaml.safe_load(f)
                return config if config else {}
        else:
            # Fallback to default config.yaml if it exists in the same directory
            default_path = os.path.join(os.path.dirname(__file__), "config.yaml")
            if os.path.exists(default_path):
                with open(default_path, 'r') as f:
                    config = yaml.safe_load(f)
                    return config if config else {}

        # Absolute minimum required to avoid crashes if no config is found
        return {
            "seed_term": "Mental Health",
            "discovery": {
                "max_levels": 3,
                "level_thresholds": {1: 10000, 2: 5000, 3: 1000},
                "max_children_per_node": 10,
                "total_max_terms": 50
            },
            "output_json": "scripts/research/mesh/v4/discovery_v4.json",
            "logging": {"level": "INFO"}
        }

    def _setup_logging(self):
        logging.basicConfig(
            level=self.config['logging']['level'],
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )

    async def run(self, interactive: bool = False):
        self.cli.display_header()

        seed = self.config['seed_term']
        if interactive:
            seed = self.cli.prompt_theme()

        self.cli.display_info(f"Starting hierarchical discovery for theme: [bold]{seed}[/bold]")
        
        # Discovery Phase
        with self.cli.get_progress_context() as progress:
            task = progress.add_task("[cyan]Building Discovery Tree...", total=None) # Total unknown in recursive
            
            tree_data = await self.engine.run(seed_term=seed)
            
            progress.update(task, completed=100) # Simple completion flag

        # Display Resulting Tree
        self.cli.display_tree(tree_data)

        # Save results
        output_path = self.config.get('output_json', "scripts/research/mesh/v4/discovery_v4.json")
        self.engine.save_tree(output_path)
        
        # Final Telemetry
        self.cli.display_telemetry(self.client.get_telemetry())
        self.cli.display_info(f"Pipeline complete. Tree saved to {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MeSH Discovery Suite V4")
    parser.add_argument("--config", help="Path to config.yaml", default="scripts/research/mesh/v4/config.yaml")
    parser.add_argument("--interactive", action="store_true", help="Run in interactive mode")
    parser.add_argument("--seed", help="Seed term for discovery")

    args = parser.parse_args()

    pipeline = MeSHPipelineV4(config_path=args.config)
    if args.seed:
        pipeline.config['seed_term'] = args.seed

    try:
        asyncio.run(pipeline.run(interactive=args.interactive))
    except KeyboardInterrupt:
        print("\nPipeline interrupted by user.")
        sys.exit(0)
    except Exception as e:
        print(f"\nPipeline failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

"""
MeSH Discovery Suite V3 - Main Pipeline
Orchestrates the complete discovery, analysis, and visualization workflow.
"""
import asyncio
import logging
import argparse
import yaml
import os
import sys

# Add the current directory to sys.path to allow relative-like imports if run as a script
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.client import PubMedClientV3
from core.engine import DiscoveryEngineV3
from analytics.processor import DataProcessorV3
from viz.visualizer import VisualizerV3
from nlp.nlp_engine import NLPEngineV3
from ui.cli import CLIV3

class MeSHPipelineV3:
    """
    Main pipeline for the MeSH Discovery Suite V3.
    """
    def __init__(self, config_path: str = None):
        self.config = self._load_config(config_path)
        self._setup_logging()

        self.cli = CLIV3()
        self.client = PubMedClientV3(api_keys=self.config.get('api_keys'))
        self.engine = DiscoveryEngineV3(
            self.client,
            min_count=self.config.get('min_count', 100),
            checkpoint_path=self.config.get('checkpoint_path', "scripts/research/mesh/v3/checkpoint.json")
        )
        self.processor = DataProcessorV3()
        self.visualizer = VisualizerV3(output_dir=self.config.get('viz_output_dir', "scripts/research/mesh/v3/viz_output"))
        self.nlp = NLPEngineV3()

    def _load_config(self, path: str) -> dict:
        default_config = {
            "seed_term": "Attention-Deficit/Hyperactivity Disorder",
            "max_terms": 20,
            "min_count": 20000,
            "viz_output_dir": "scripts/research/mesh/v3/viz_output",
            "checkpoint_path": "scripts/research/mesh/v3/checkpoint.json",
            "logging": {"level": "INFO"}
        }
        if path and os.path.exists(path):
            with open(path, 'r') as f:
                config = yaml.safe_load(f)
                default_config.update(config)
        return default_config

    def _setup_logging(self):
        logging.basicConfig(
            level=self.config['logging']['level'],
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )

    async def run(self, interactive: bool = False):
        """
        Runs the discovery pipeline.
        """
        self.cli.display_header()

        seed = self.config['seed_term']
        if interactive:
            seed = self.cli.prompt_theme()

        self.cli.display_info(f"Starting discovery for theme: [bold]{seed}[/bold]")

        # 1. Discovery Phase
        with self.cli.get_progress_context() as progress:
            task = progress.add_task("[cyan]Discovering themes...", total=self.config['max_terms'])

            # Run the discovery engine
            results = await self.engine.run(
                seed_term=seed,
                max_terms=self.config['max_terms']
            )

            progress.update(task, completed=len(results))

        # 2. Display Discovery Results
        self.cli.display_results(results)

        # 3. Analytics Phase
        self.cli.display_info("Performing advanced analytics...")
        matrix = self.processor.generate_cooccurrence_matrix(results)

        # 4. Visualization Phase
        self.cli.display_info("Generating visualizations...")
        self.visualizer.plot_growth_comparison(results)
        self.visualizer.plot_cooccurrence_network(matrix)

        # 5. NLP Phase (Optional enrichment)
        self.cli.display_info("Starting NLP Theme Extraction...")

        # Enrichment: Fetch real abstracts for the top discovered terms
        abstracts = []
        for r in results[:3]: # Sampling top 3 results for performance
            self.cli.display_info(f"Fetching abstracts for term: [bold]{r['term']}[/bold]")

            # Find papers where this is a Major Topic
            search_data = await self.client.esearch(f"({r['term']}[MeSH Major Topic])", retmax=5)
            ids = search_data.get("esearchresult", {}).get("idlist", [])

            if ids:
                xml_content = await self.client.efetch(ids=ids)
                if xml_content:
                    try:
                        root = ElementTree.fromstring(xml_content)
                        for abstract in root.findall(".//AbstractText"):
                            if abstract.text:
                                abstracts.append(abstract.text)
                    except Exception as e:
                        self.cli.display_error(f"Failed to parse XML for {r['term']}: {e}")

        if abstracts:
            self.cli.display_info(f"Analyzing {len(abstracts)} real abstracts...")
            themes = self.nlp.extract_themes(abstracts)
            self.cli.display_info(f"Extracted Keywords: [bold]{', '.join(themes['keywords'])}[/bold]")
            self.cli.display_info(f"Extracted Topics: [bold]{', '.join(themes['topics'])}[/bold]")
        else:
            self.cli.display_info("No real abstracts found for NLP analysis.")

        # 6. Final Report & Telemetry
        self.cli.display_telemetry(self.client.get_telemetry())
        self.cli.display_info(f"Pipeline complete. Visualizations saved to {self.visualizer.output_dir}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MeSH Discovery Suite V3")
    parser.add_argument("--config", help="Path to config.yaml")
    parser.add_argument("--interactive", action="store_true", help="Run in interactive mode")
    parser.add_argument("--seed", help="Seed term for discovery")
    parser.add_argument("--max_terms", type=int, help="Maximum number of terms to discover")

    args = parser.parse_args()

    pipeline = MeSHPipelineV3(config_path=args.config)
    if args.seed:
        pipeline.config['seed_term'] = args.seed
    if args.max_terms:
        pipeline.config['max_terms'] = args.max_terms

    try:
        asyncio.run(pipeline.run(interactive=args.interactive))
    except KeyboardInterrupt:
        print("\nPipeline interrupted by user.")
        sys.exit(0)

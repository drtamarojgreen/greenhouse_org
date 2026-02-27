"""
MeSH Discovery Suite V9 - Main Pipeline
Orchestrates discovery, enrichment, temporal analysis, graph building, and visualization.
"""
import asyncio
import os
import yaml
import json
import time
import logging
import argparse
from datetime import datetime
from typing import List, Dict, Any

from core.client import PubMedClientV9
from core.ct_client import ClinicalTrialsClientV9
from core.engine import DiscoveryEngineV9
from core.temporal_engine import TemporalEngineV9
from analytics.processor import DataProcessorV9
from graph.builder import GraphBuilderV9
from viz.visualizer import VisualizerV9
from ui.cli import CLIV9

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

class PipelineV9:
    """
    Main Execution Pipeline (v9).
    """
    def __init__(self, config_path: str = "scripts/research/mesh/v9/config.yaml"):
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)

        self.pubmed_client = PubMedClientV9(
            api_key=os.getenv("PUBMED_API_KEY"),
            cache_db=self.config.get("cache", {}).get("db_path", "scripts/research/mesh/v9/cache.db")
        )
        self.ct_client = ClinicalTrialsClientV9(
            cache_db=self.config.get("cache", {}).get("db_path", "scripts/research/mesh/v9/cache.db")
        )
        self.discovery_engine = DiscoveryEngineV9(self.pubmed_client, self.config)
        self.temporal_engine = TemporalEngineV9(self.pubmed_client, self.config)
        self.processor = DataProcessorV9(self.config)
        self.graph_builder = GraphBuilderV9(self.config)
        self.visualizer = VisualizerV9(self.config)
        self.cli = CLIV9()

        self.results = {}
        self.output_dir = self.config.get("output", {}).get("base_dir", "scripts/research/mesh/v9/output")
        os.makedirs(self.output_dir, exist_ok=True)

    async def run(self, seed_term: str = None):
        start_time = time.time()
        seed = seed_term or self.config.get("seed_term", "Depression")
        self.cli.display_welcome()

        try:
            # [STAGE 1] Discovery
            discovery_results = []
            logger.info(f"Starting discovery for '{seed}'...")
            async for res in self.discovery_engine.run(seed):
                discovery_results.append(res)

            accepted_terms = [r["term"] for r in discovery_results if r["status"] == "accepted"]
            self.cli.display_discovery_results(discovery_results)

            # [STAGE 2] Clinical Trials Enrichment
            logger.info("Enriching with ClinicalTrials.gov data...")
            trial_results = {}
            phase_data = {}
            for term in accepted_terms[:10]: # Limit enrichment for demo/test
                trials = await self.ct_client.get_trials(term, max_pages=2)
                trial_results[term] = trials
                phase_data[term] = await self.ct_client.get_trial_phase_distribution(term)

            # [STAGE 3] Temporal Analysis
            temporal_data = None
            if self.config.get("temporal", {}).get("enabled", True):
                logger.info("Performing longitudinal temporal analysis...")
                temporal_data = await self.temporal_engine.run(accepted_terms[:5])
                self.results["temporal"] = temporal_data

            # [STAGE 4] Analytics & Graph Building
            logger.info("Building knowledge graph and running analytics...")
            self.graph_builder.build_from_discovery(discovery_results, trial_results)
            centrality = self.graph_builder.analyze()

            # Enrich discovery results with history and metrics
            enriched_results = []
            for res in discovery_results:
                if res["status"] != "accepted": continue

                term = res["term"]
                # For demo, generate synthetic history if not in temporal_data
                history_counts = [int(res["count"] * (0.8 + 0.05 * i)) for i in range(5)]
                history_years = [2021, 2022, 2023, 2024, 2025]

                # Check if we have real temporal data
                if temporal_data:
                    for ds in temporal_data["datasets"]:
                        if ds["label"] == term:
                            history_counts = ds["counts"]
                            history_years = [int(i.split('-')[0]) for i in temporal_data["intervals"]]

                metrics = self.processor.calculate_growth_metrics(history_counts, history_years)
                momentum = self.processor.calculate_research_momentum(history_counts, history_years)

                res["metrics"] = metrics
                res["momentum_score"] = momentum
                enriched_results.append(res)

            # [STAGE 5] Visualization
            logger.info("Generating publication-ready figures...")
            if temporal_data:
                self.visualizer.plot_timeline(temporal_data, normalize=True)

            results_df = self.processor.compare_conditions({r["term"]: r for r in enriched_results})
            self.visualizer.plot_growth_comparison(results_df)
            self.visualizer.plot_network(self.graph_builder.G)
            self.visualizer.plot_trial_phases(phase_data)

            # [STAGE 6] Save Results
            output_file = os.path.join(self.output_dir, "discovery_v9.json")
            with open(output_file, "w") as f:
                json.dump({
                    "seed_term": seed,
                    "generated_at": datetime.now().isoformat(),
                    "discovery": enriched_results,
                    "graph_top_nodes": self.graph_builder.get_top_nodes(20)
                }, f, indent=2)

            results_df.to_csv(os.path.join(self.output_dir, "summary_v9.csv"), index=False)
            self.graph_builder.export_csv(os.path.join(self.output_dir, "graph_v9.csv"))
            self.graph_builder.export_json(os.path.join(self.output_dir, "graph_v9.json"))

            elapsed = time.time() - start_time
            telemetry = {
                "pubmed": self.pubmed_client.get_telemetry(),
                "ct": self.ct_client.get_telemetry()
            }
            self.cli.display_summary(telemetry, elapsed)

            logger.info(f"Pipeline complete. Outputs saved to {self.output_dir}")

        finally:
            await self.pubmed_client.close()
            await self.ct_client.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", type=str, help="Seed term for discovery")
    args = parser.parse_args()

    pipeline = PipelineV9()
    asyncio.run(pipeline.run(seed_term=args.seed))

"""
Main entry point for the Enhanced MeSH Discovery Suite (v2).
"""
import logging
import json
import os
import argparse

try:
    import yaml
except ImportError:
    print("PyYAML is not installed. Please install it using: pip install pyyaml")
    exit(1)

try:
    from .core.client import PubMedClient
    from .core.engine import DiscoveryEngine
    from .analytics.processor import DataProcessor
    from .viz.charts import Visualizer
except ImportError:
    from core.client import PubMedClient
    from core.engine import DiscoveryEngine
    from analytics.processor import DataProcessor
    from viz.charts import Visualizer

CONFIG_PATH = "scripts/research/mesh/v2/config.yaml"

def load_config(config_path):
    """Loads the configuration from a YAML file."""
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    return config

def setup_logging(logging_config):
    """Sets up logging based on the configuration."""
    logging.basicConfig(level=logging_config['level'], format=logging_config['format'])

def run_v2_pipeline(seed, max_terms, min_count, output_path):
    """Main function to run the MeSH discovery pipeline."""
    logger = logging.getLogger(__name__)
    
    client = PubMedClient()
    engine = DiscoveryEngine(client, min_count=min_count)
    visualizer = Visualizer()
    processor = DataProcessor()

    # 1. Discover Terms
    discovered = engine.run(seed, max_terms=max_terms)

    # 2. Enrich with Analysis (Z-score, CAGR)
    logger.info("Enriching results with advanced metrics...")

    # Fetch historical data for each term to get real trends
    historical_years = [2020, 2021, 2022, 2023, 2024]
    for item in discovered:
        logger.info(f"Fetching historical counts for {item['term']}...")
        item_counts = []
        for year in historical_years:
            item_counts.append(client.get_publication_count(item['term'], year=year))
        item['history'] = {"years": historical_years, "counts": item_counts}

    enriched_results = processor.calculate_advanced_metrics(discovered)

    results = {
        "seed": seed,
        "discovery_results": enriched_results,
        "summary": {
            "total_terms": len(enriched_results)
        }
    }

    # 3. Save Data
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=4)
    logger.info(f"Saved results to {output_path}")

    # 4. Generate Visualizations
    if discovered:
        visualizer.plot_growth_comparison(discovered)
        logger.info("Generated growth comparison plot.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Enhanced MeSH Discovery Suite (v2)")
    parser.add_argument("--config", default=CONFIG_PATH, help="Path to the configuration file.")
    parser.add_argument("--test", action="store_true", help="Run in test mode.")
    args = parser.parse_args()

    config = load_config(args.config)
    setup_logging(config['logging'])

    if args.test:
        config['max_terms'] = config['test']['max_terms']

    run_v2_pipeline(
        seed=config['seed_term'],
        max_terms=config['max_terms'],
        min_count=config['min_count'],
        output_path=config['output_path']
    )

"""
Main entry point for the Enhanced MeSH Discovery Suite (v2).
"""
import logging
import json
import os
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

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def run_v2_pipeline(seed="Mental Health", max_terms=40, min_count=20000):
    client = PubMedClient()
    engine = DiscoveryEngine(client, min_count=min_count)
    visualizer = Visualizer()
    processor = DataProcessor()

    # 1. Discover Terms
    discovered = engine.run(seed, max_terms=max_terms)

    # 2. Enrich with Analysis (Z-score, CAGR)
    # For simplicity in this v2 demo, we'll just get the current count
    # and maybe a few historical points if we were doing full time-series.

    results = {
        "seed": seed,
        "discovery_results": discovered,
        "summary": {
            "total_terms": len(discovered)
        }
    }

    # 3. Save Data
    output_path = "scripts/research/mesh/v2/discovery_v2.json"
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=4)
    logger.info(f"Saved results to {output_path}")

    # 4. Generate Visualizations
    if discovered:
        visualizer.plot_growth_comparison(discovered)
        logger.info("Generated growth comparison plot.")

if __name__ == "__main__":
    import sys
    # Support for quick test run
    terms_limit = 5
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        terms_limit = 1

    run_v2_pipeline(max_terms=terms_limit)

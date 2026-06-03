"""
Main entry point for the MeSH Historical Analysis Pipeline.
Orchestrates loading, parsing, pruning, and analysis.
"""
import os
import glob
import argparse
import pandas as pd
from concurrent.futures import ProcessPoolExecutor
from collections import Counter

from . import config
from . import utils
from .mesh_loader import MeshLoader
from .pubmed_parser import PubMedParser
from .analysis import Analyzer

logger = utils.setup_logger("MeSH_Pipeline")

def parse_worker(args):
    """Helper for multiprocessing"""
    file_path, allowed_uis = args
    parser = PubMedParser(allowed_mesh_uis=allowed_uis)
    return parser.parse_file(file_path)

@utils.timer
def run_ingest(file_list, allowed_uis=None):
    """
    Runs parallel ingestion of PubMed files.
    """
    logger.info(f"Starting ingest of {len(file_list)} files with {config.NUM_WORKERS} workers.")
    
    # Prepare arguments for workers
    worker_args = [(f, allowed_uis) for f in file_list]
    
    global_counter = Counter()
    
    with ProcessPoolExecutor(max_workers=config.NUM_WORKERS) as executor:
        results = executor.map(parse_worker, worker_args)
        
        for i, res in enumerate(results):
            global_counter.update(res)
            if i % 10 == 0 and i > 0:
                logger.info(f"Processed {i}/{len(file_list)} files...")

    return global_counter

def main():
    parser = argparse.ArgumentParser(description="MeSH Historical Analysis Pipeline")
    parser.add_argument("--mode", choices=["discovery", "full"], required=True, 
                        help="'discovery' runs on sample data to build term list. 'full' runs on all data.")
    args = parser.parse_args()

    # --- Step 1: Load MeSH Tree Structure ---
    loader = MeshLoader(config.MESH_DESC_XML, logger)
    candidate_map = loader.load_descriptors()
    candidate_uis = set(candidate_map.keys())

    # --- Step 2: Define File List based on Mode ---
    all_files = sorted(glob.glob(os.path.join(config.PUBMED_DIR, "*.xml.gz")))
    
    if args.mode == "discovery":
        # Use a sample (e.g., first 5 and last 5 files to get spread)
        if len(all_files) > 10:
            files_to_process = all_files[:5] + all_files[-5:]
        else:
            files_to_process = all_files
        logger.info(f"Discovery Mode: Processing {len(files_to_process)} sample files.")
    else:
        files_to_process = all_files
        # In full mode, we might want to load a curated list from a previous discovery run
        curated_path = os.path.join(config.OUTPUT_DIR, "curated_terms.json")
        if os.path.exists(curated_path):
            logger.info("Loading curated term list from previous run...")
            curated_data = utils.load_json(curated_path)
            candidate_uis = set(curated_data.keys())
            candidate_map = curated_data # Update map to only contain curated
        else:
            logger.warning("No curated list found. Running full ingest on ALL tree candidates.")

    # --- Step 3: Ingest PubMed Data ---
    raw_counts = run_ingest(files_to_process, allowed_uis=candidate_uis)

    # Convert Counter to DataFrame
    data = []
    for (ui, year), count in raw_counts.items():
        data.append({'ui': ui, 'year': year, 'count': count})
    
    df = pd.DataFrame(data)
    
    # --- Step 4: Analysis & Pruning ---
    analyzer = Analyzer(df, candidate_map, logger)
    
    if args.mode == "discovery":
        # Calculate scores and prune
        stats = analyzer.calculate_tss()
        kept_terms = analyzer.prune_terms(stats)
        
        # Save curated list for Full Run
        os.makedirs(config.OUTPUT_DIR, exist_ok=True)
        
        # Save the UI:Name map of kept terms
        final_map = {row['ui']: row['name'] for _, row in kept_terms.iterrows()}
        utils.save_json(final_map, os.path.join(config.OUTPUT_DIR, "curated_terms.json"))
        
        # Save stats
        kept_terms.to_csv(os.path.join(config.OUTPUT_DIR, "discovery_stats.csv"), index=False)
        logger.info("Discovery complete. Curated list saved.")

    else:
        # Full Analysis Mode
        logger.info("Aggregating full dataset results...")
        
        # Save raw time series
        df.to_csv(os.path.join(config.OUTPUT_DIR, "full_time_series.csv"), index=False)
        
        # Perform Modeling on top terms
        top_terms = df.groupby('ui')['count'].sum().nlargest(50).index
        results = []
        for ui in top_terms:
            fit = analyzer.fit_growth_models(ui)
            if fit:
                results.append({
                    'ui': ui, 
                    'name': candidate_map.get(ui, "Unknown"),
                    'model_type': fit['model'],
                    'params': str(fit['params'])
                })
        
        pd.DataFrame(results).to_csv(os.path.join(config.OUTPUT_DIR, "modeling_results.csv"), index=False)
        logger.info("Full analysis complete.")

if __name__ == "__main__":
    main()
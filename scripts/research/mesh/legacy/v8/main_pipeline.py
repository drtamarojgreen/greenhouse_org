import asyncio
import aiohttp
import yaml
import logging
import sys
import os

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../..")))

from scripts.research.mesh.v8.data_sources.drugbank_client import DrugBankClient
from scripts.research.mesh.v8.data_sources.disgenet_client import DisGeNETClient
from scripts.research.mesh.v8.data_sources.opentargets_client import OpenTargetsClient
from scripts.research.mesh.v8.data_sources.clinicaltrials_client import ClinicalTrialsClient
from scripts.research.mesh.v8.data_sources.pubmed_client import PubMedClient
from scripts.research.mesh.v8.graph_builder import GraphBuilder

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("v8_pipeline")

async def run_pipeline(config_path: str):
    if not os.path.exists(config_path):
        logger.error(f"Config file not found: {config_path}")
        return

    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)

    disorder = config['pipeline']['disorder']
    output_csv = config['pipeline']['output_csv']
    cache_db = config['pipeline']['cache_db']

    logger.info(f"Starting discovery pipeline for: {disorder}")

    async with aiohttp.ClientSession() as session:
        # Initialize clients
        drugbank = DrugBankClient(api_key=config['api_keys'].get('drugbank'), cache_db=cache_db)
        disgenet = DisGeNETClient(api_key=config['api_keys'].get('disgenet'), cache_db=cache_db)
        opentargets = OpenTargetsClient(cache_db=cache_db)
        clinicaltrials = ClinicalTrialsClient(cache_db=cache_db)
        pubmed = PubMedClient(api_key=config['api_keys'].get('pubmed'), cache_db=cache_db)

        # Fetch data concurrently
        logger.info("Fetching data from multiple sources...")
        drug_task = drugbank.get_drugs_for_disorder(session, disorder)
        disgenet_task = disgenet.get_associations_for_disorder(session, disorder)
        opentargets_task = opentargets.get_drugs_for_disease(session, config['pipeline'].get('efo_id', 'EFO_0000249'))
        trial_task = clinicaltrials.get_trials_for_disorder(session, disorder)
        pmids_task = pubmed.search_articles(session, disorder, retmax=config['limits'].get('pubmed_retmax', 10))

        drugs, disgenet_data, opentargets_data, trials, pmids = await asyncio.gather(
            drug_task, disgenet_task, opentargets_task, trial_task, pmids_task
        )

        # Fetch article details
        articles = await pubmed.get_article_details(session, pmids)

        logger.info(f"Discovered {len(drugs)} (DrugBank) and {len(opentargets_data)} (OpenTargets) drugs, {len(disgenet_data)} gene associations, {len(trials)} trials, and {len(articles)} articles.")

        # Build graph
        logger.info("Building graph...")
        builder = GraphBuilder()
        builder.build_from_data(disorder, drugs, trials, articles, disgenet_data, opentargets_data)

        # Export to CSV
        builder.export_to_csv(output_csv)
        logger.info(f"Graph exported to {output_csv}")

if __name__ == "__main__":
    # Use absolute path or ensure current working directory is project root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    config_file = os.path.join(script_dir, "config.yaml")
    asyncio.run(run_pipeline(config_file))

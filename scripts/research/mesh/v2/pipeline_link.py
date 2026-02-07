import logging
import json
import os
import argparse
import time
from Bio import Entrez

# Configure Entrez (using email and API key from environment, with a timeout)
Entrez.email = "cito@greenhousemd.org"
Entrez.api_key = os.getenv("NCBI_API_KEY")
Entrez.timeout = 30 # Set a global timeout for Entrez requests (in seconds)

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

DISCOVERY_INPUT_PATH = "scripts/research/mesh/v2/discovery_v2.json"
LINK_OUTPUT_PATH = "scripts/research/mesh/v2/pipeline_link_output.json"

def get_publication_count(term1, term2):
    """
    Fetches the publication count for a combined search of two terms on PubMed.
    """
    combined_term = f"{term1} AND {term2}"
    logger.info(f"Searching PubMed for publication count: '{combined_term}'")
    try:
        # retmax="0" means we only want the count, not actual records.
        handle = Entrez.esearch(db="pubmed", term=combined_term, retmax="0")
        record = Entrez.read(handle)
        handle.close()
        time.sleep(0.3)  # Respect NCBI's rate limit

        count = int(record["Count"])
        logger.info(f"Found {count} publications for '{combined_term}'")
        return count
    except Exception as e:
        logger.error(f"Error fetching publication count for '{combined_term}': {e}", exc_info=True)
        return 0 # Return 0 on error

def main():
    parser = argparse.ArgumentParser(description="MeSH Discovery - Link Analysis Pipeline")
    parser.add_argument("--discovery_input", default=DISCOVERY_INPUT_PATH, help="Path to the discovery JSON file.")
    parser.add_argument("--output", default=LINK_OUTPUT_PATH, help="Path to the output JSON file.")
    args = parser.parse_args()

    if not os.path.exists(args.discovery_input):
        logger.error(f"Discovery data file not found: {args.discovery_input}")
        exit(1)

    with open(args.discovery_input, 'r', encoding='utf-8') as f:
        discovery_data = json.load(f)

    discovery_results = discovery_data.get("discovery_results", [])
    if not discovery_results:
        logger.warning("No discovery results found in the input JSON. Exiting.")
        exit(0)

    base_term = discovery_results[0]["term"]
    logger.info(f"Base term identified: '{base_term}'")

    link_analysis_results = []

    # Iterate from the second term onwards to combine with the base term
    for entry in discovery_results[1:]:
        subsequent_term = entry["term"]
        count = get_publication_count(base_term, subsequent_term)
        link_analysis_results.append({
            "base_term": base_term,
            "compared_term": subsequent_term,
            "publication_count": count
        })

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(link_analysis_results, f, indent=2)

    logger.info(f"Link analysis results exported to {args.output}")

if __name__ == "__main__":
    main()

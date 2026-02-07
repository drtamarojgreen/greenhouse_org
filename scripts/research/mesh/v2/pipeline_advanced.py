# ------------------------------------------------------------
# Mental Health → MeSH Mechanisms → Interventions Tree Builder
# ------------------------------------------------------------

import logging
import json
import os
import argparse
import time
# Removed io import

try:
    import yaml
except ImportError:
    print("PyYAML is not installed. Please install it using: pip install pyyaml")
    exit(1)

from Bio import Entrez

# Configure Entrez
# Replace with your actual email address
Entrez.email = "cito@greenhousemd.org"  
# Configure Entrez to respect NCBI's E-utility usage policies
# Pause for 1 second between requests
Entrez.api_key = os.getenv("NCBI_API_KEY") 
Entrez.timeout = 30 # Set a global timeout for Entrez requests (in seconds)

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

CONFIG_PATH = "scripts/research/mesh/v2/config.yaml"

def load_config(config_path):
    """Loads the configuration from a YAML file."""
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    return config

# ---------- Node model ----------

class Node:
    def __init__(self, name, mesh_id=None, node_type="concept"):
        self.name = name
        self.mesh_id = mesh_id
        self.node_type = node_type
        self.children = []

    def add_child(self, node):
        self.children.append(node)

    def to_dict(self):
        return {
            "name": self.name,
            "mesh_id": self.mesh_id,
            "type": self.node_type,
            "children": [child.to_dict() for child in self.children]
        }

# ---------- MeSH Data Fetching and Classification ----------

def get_mesh_details(term):
    """Fetches MeSH details for a given term using Entrez."""
    logger.info(f"Fetching MeSH details for term: '{term}'")
    try:
        logger.debug(f"Calling Entrez.esearch for term: '{term}'")
        handle = Entrez.esearch(db="mesh", term=term, retmax="1")
        record = Entrez.read(handle)
        handle.close()
        time.sleep(0.3)  # Respect NCBI's rate limit
        logger.debug(f"Entrez.esearch returned IdList: {record['IdList']}")

        if record["IdList"]:
            mesh_id = record["IdList"][0]
            logger.debug(f"Found MeSH ID: {mesh_id} for term: '{term}'")
            # Use esummary instead of efetch for MeSH as it reliably returns XML with Tree Numbers.
            # Note: MeSH efetch retmode=xml is often unsupported/problematic in standard Entrez.
            logger.debug(f"Calling Entrez.esummary for MeSH ID: {mesh_id}")
            handle = Entrez.esummary(db="mesh", id=mesh_id, retmode="xml")
            mesh_record = Entrez.read(handle)
            handle.close()
            time.sleep(0.3) # Respect NCBI's rate limit
            logger.debug(f"Entrez.esummary returned record for MeSH ID: {mesh_id}")
            
            tree_numbers = []
            # esummary returns a list of records (DocSums).
            # For db="mesh", tree numbers are nested within 'DS_IdxLinks' -> 'TreeNum'.
            if isinstance(mesh_record, list) and len(mesh_record) > 0:
                record_data = mesh_record[0]
                if "DS_IdxLinks" in record_data:
                    for link in record_data["DS_IdxLinks"]:
                        if "TreeNum" in link:
                            tree_numbers.append(str(link["TreeNum"]))
            logger.debug(f"Extracted tree numbers: {tree_numbers} for MeSH ID: {mesh_id}")
            
            return {"mesh_id": mesh_id, "tree_numbers": tree_numbers}
        logger.info(f"No MeSH ID found for term: '{term}'")
        return None
    except Exception as e:
        logger.error(f"Error fetching MeSH details for '{term}': {e}", exc_info=True)
        return None

def classify_term(term_details):
    """Classifies a term as Biological Mechanism or Intervention based on MeSH Tree Numbers."""
    if not term_details or not term_details.get("tree_numbers"):
        return "concept"  # Default to generic concept if no details

    tree_numbers = term_details["tree_numbers"]
    # G: Biological Sciences
    is_biological_mechanism = any(tn.startswith('G') for tn in tree_numbers)
    # N: Health Care, E: Analytical, Diagnostic and Therapeutic Techniques and Equipment
    is_intervention = any(tn.startswith('N') or tn.startswith('E') for tn in tree_numbers)

    if is_biological_mechanism and is_intervention:
        return "mechanism_and_intervention" # Could be both, handle as needed
    elif is_biological_mechanism:
        return "biological_mechanism"
    elif is_intervention:
        return "intervention"
    else:
        return "concept"

# ---------- Tree construction from JSON data ----------

def build_dynamic_mesh_tree(discovery_data, max_depth=2):
    root = Node("MeSH Discoveries", node_type="root")
    
    # Store fetched MeSH details to avoid duplicate API calls
    mesh_details_cache = {}

    for entry in discovery_data.get("discovery_results", []):
        seed_term_name = entry["term"]
        seed_term_details = mesh_details_cache.get(seed_term_name)
        if not seed_term_details:
            seed_term_details = get_mesh_details(seed_term_name)
            if seed_term_details:
                mesh_details_cache[seed_term_name] = seed_term_details
        
        seed_mesh_id = seed_term_details["mesh_id"] if seed_term_details else None
        seed_node = Node(seed_term_name, seed_mesh_id, node_type="seed_term")
        
        biological_mechanisms_node = Node("Biological Mechanisms", node_type="category")
        interventions_node = Node("Interventions", node_type="category")
        other_concepts_node = Node("Other Concepts", node_type="category")

        for related_term_name in entry.get("related", []):
            related_term_details = mesh_details_cache.get(related_term_name)
            if not related_term_details:
                related_term_details = get_mesh_details(related_term_name)
                if related_term_details:
                    mesh_details_cache[related_term_name] = related_term_details

            if related_term_details:
                term_type = classify_term(related_term_details)
                related_mesh_id = related_term_details["mesh_id"]
                
                if term_type == "biological_mechanism":
                    biological_mechanisms_node.add_child(Node(related_term_name, related_mesh_id, node_type=term_type))
                elif term_type == "intervention":
                    interventions_node.add_child(Node(related_term_name, related_mesh_id, node_type=term_type))
                else:
                    other_concepts_node.add_child(Node(related_term_name, related_mesh_id, node_type=term_type))
        
        if biological_mechanisms_node.children:
            seed_node.add_child(biological_mechanisms_node)
        if interventions_node.children:
            seed_node.add_child(interventions_node)
        if other_concepts_node.children:
            seed_node.add_child(other_concepts_node)

        root.add_child(seed_node)

    return root

# ---------- Export ----------

import urllib.request
import urllib.error

# ... (rest of the imports)

def test_urllib_timeout(url="https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi", timeout=10):
    logger.info(f"Testing urllib.request.urlopen to {url} with timeout {timeout}s...")
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            logger.info(f"urllib test successful. Status: {response.status}")
            # Optionally read a bit of content to ensure full connection
            # content = response.read(100)
            # logger.debug(f"Received: {content[:50]}...")
    except urllib.error.URLError as e:
        logger.error(f"urllib test failed with URLError: {e}. This might indicate a network or DNS issue.")
        return False
    except TimeoutError as e:
        logger.error(f"urllib test failed with TimeoutError: {e}. Connection timed out.")
        return False
    except Exception as e:
        logger.error(f"urllib test failed with unexpected error: {e}")
        return False
    return True

# ... (rest of the file)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Enhanced MeSH Discovery Suite - Advanced Tree Builder")
    parser.add_argument("--config", default=CONFIG_PATH, help="Path to the configuration file.")
    args = parser.parse_args()

    config = load_config(args.config)

    # Make sure to set your email for Entrez
    if Entrez.email == "your.email@example.com":
        logger.warning("Please set your Entrez.email in pipeline_advanced.py for NCBI API usage.")
    
    discovery_input_path = config.get("output_path", "scripts/research/mesh/v2/discovery_v2.json")
    advanced_output_path = config.get("advanced_pipeline_output_path", "scripts/research/mesh/v2/mesh_mental_health_tree.json")

    if not os.path.exists(discovery_input_path):
        logger.error(f"Discovery data file not found: {discovery_input_path}. Please run pipeline.py first.")
        exit(1)

    with open(discovery_input_path, 'r', encoding='utf-8') as f:
        discovery_data = json.load(f)

    logger.info("Building dynamic MeSH tree...")
    tree = build_dynamic_mesh_tree(discovery_data)


import csv
import re
import sys
import json
import argparse
import requests
import time

def get_top_nodes(csv_file_path, num_nodes=50):
    """
    Reads the graph.csv file, parses each line to extract the node name,
    number of edges, and its importance score (4th column).
    Sorts them by a composite score (num_edges + importance), and then returns the top N unique node names.
    """
    all_nodes_data = []
    
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as f: # Specify encoding
            lines = f.read().splitlines()
            
        for line_num, line in enumerate(lines):
            original_line = line
            line = line.strip()
            if not line:
                continue

            try:
                # Ultra-flexible Regex: Captures all fields delimited by commas, assuming first field is quoted.
                # 1. Node Name: \"(.*?)\"
                # 2. Node ID: (.*?)
                # 3. Connected Node IDs string: (.*?)
                # 4. Importance/Weight (4th column): (\d+)
                # 5. Value2: (.*)
                regex = r'\"(.*?)\"\s*,\s*(.*?)\s*,\s*(.*?)\s*,\s*(\d+)\s*,\s*(.*)'
                match = re.search(regex, line)
                
                if match:
                    node_name = match.group(1).strip()
                    # Node ID is match.group(2) - not used for sorting but captured
                    connected_nodes_str = match.group(3).strip()
                    importance_str = match.group(4).strip() # Importance is now group 4
                    # Value2 is match.group(5) - not used for sorting but captured
                    
                    # Calculate number of edges
                    num_edges = 0
                    # Check if connected_nodes_str looks like a list before processing
                    if connected_nodes_str.startswith('[') and connected_nodes_str.endswith(']'):
                        content_inside_brackets = connected_nodes_str[1:-1]
                        if content_inside_brackets.strip(): # Check if there's content inside (not empty [])
                            connections = content_inside_brackets.split(',')
                            num_edges = len([c for c in connections if c.strip()]) # Count non-empty connection IDs
                    
                    try:
                        importance = int(importance_str)
                        # Calculate a composite score: sum of number of edges and importance
                        composite_score = num_edges + importance
                        all_nodes_data.append({
                            'name': node_name, 
                            'importance': importance,
                            'num_edges': num_edges,
                            'composite_score': composite_score
                        })
                    except ValueError:
                        print(f'Warning: Could not convert importance to int (Line {line_num+1}). Line: \"{line}\", problematic part (regex extracted): \"{importance_str}\"', file=sys.stderr)
                else:
                    print(f'Warning: Line does not match expected regex format (Line {line_num+1}). Original: "{original_line}" | Stripped: "{line}" | Regex: "{regex}"', file=sys.stderr)
            except Exception as e:
                print(f'Error processing line (Line {line_num+1}) with regex: \"{line}\" - {e}', file=sys.stderr)

    except FileNotFoundError:
        print(f'Error: File not found at {csv_file_path}', file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f'An unexpected error occurred: {e}', file=sys.stderr)
        sys.exit(1)

    # Sort by composite score (descending), then by importance (descending) for tie-breaking
    sorted_nodes = sorted(all_nodes_data, key=lambda x: (x['composite_score'], x['importance']), reverse=True)
    
    top_unique_nodes = []
    seen_names = set()
    for node in sorted_nodes:
        if node['name'] not in seen_names:
            top_unique_nodes.append(node['name'])
            seen_names.add(node['name'])
        if len(top_unique_nodes) >= num_nodes:
            break
            
    return top_unique_nodes

def get_pubmed_data(node_name):
    """
    Queries PubMed's E-utilities API to get the count of review articles.
    Refined query to be broader.
    """
    try:
        base_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
        params = {
            "db": "pubmed",
            "term": f'({node_name}) AND review[pt]', # Broadened search term with parentheses for grouping
            "retmode": "json"
        }
        response = requests.get(base_url, params=params)
        response.raise_for_status()
        data = response.json()
        count = int(data.get("esearchresult", {}).get("count", 0))
        return {"review_articles_count": count}
    except requests.exceptions.RequestException as e:
        return {"error": f"PubMed API request failed: {e}"}
    except json.JSONDecodeError:
        return {"error": "Failed to decode PubMed API response."}
    except Exception as e:
        return {"error": f"An unexpected error occurred with PubMed API: {e}"}

def get_clinical_trials_data(node_name):
    """
    Queries ClinicalTrials.gov API to get trial counts and intervention methods.
    Refined query to use query.term for broader search.
    """
    try:
        base_url = "https://clinicaltrials.gov/api/v2/studies"
        params = {"query.term": node_name, "countTotal": "true", "pageSize": 10} # Using query.term
        response = requests.get(base_url, params=params)
        response.raise_for_status()
        data = response.json()
        count = data.get("totalCount", 0)
        
        interventions = []
        for study in data.get("studies", []):
            study_interventions = study.get("protocolSection", {}).get("armsInterventionsModule", {}).get("interventions", [])
            for intervention in study_interventions:
                interventions.append(intervention.get("name"))
                
        return {"trials_count": count, "interventions": list(set(interventions))[:5]} # Top 5 unique interventions
    except requests.exceptions.RequestException as e:
        return {"error": f"ClinicalTrials.gov API request failed: {e}"}
    except json.JSONDecodeError:
        return {"error": "Failed to decode ClinicalTrials.gov API response."}
    except Exception as e:
        return {"error": f"An unexpected error occurred with ClinicalTrials.gov API: {e}"}

def get_fda_drugs_data(node_name):
    """
    Queries openFDA API to find related drugs.
    Handles 404 gracefully.
    """
    try:
        base_url = "https://api.fda.gov/drug/label.json"
        search_query = f'description:"{node_name}"+OR+indications_and_usage:"{node_name}"'
        params = {"search": search_query, "limit": 5}
        response = requests.get(base_url, params=params)
        response.raise_for_status()
        data = response.json()
        
        drugs = []
        if "results" in data:
            for result in data["results"]:
                if "openfda" in result and "brand_name" in result["openfda"]:
                    drugs.extend(result["openfda"]["brand_name"])
        
        return {"related_drugs": list(set(drugs))}
    except requests.exceptions.RequestException as e:
        if e.response is not None and e.response.status_code == 404:
            return {"related_drugs": [], "message": "No direct drugs found for this specific term."}
        return {"error": f"openFDA API request failed: {e}"}
    except json.JSONDecodeError:
        return {"error": "Failed to decode openFDA API response."}
    except Exception as e:
        return {"error": f"An unexpected error occurred with openFDA API: {e}"}

def main():
    parser = argparse.ArgumentParser(description="Generate discovery graph data by querying external sources for research nodes.")
    parser.add_argument("--csv_path", default="docs/endpoints/graph.csv", help="Path to the graph CSV file.")
    parser.add_argument("--num_nodes", type=int, default=50, help="Number of top nodes to process.")
    parser.add_argument("--output_file", default="discovery_graph_output.json", help="Output JSON file name.")
    args = parser.parse_args()

    print(f"Fetching top {args.num_nodes} nodes from {args.csv_path}...")
    top_nodes = get_top_nodes(args.csv_path, args.num_nodes)
    print(f"Successfully identified {len(top_nodes)} top nodes.")

    discovery_data = []

    print("\nStarting data collection from APIs (PubMed, ClinicalTrials.gov, openFDA)...")
    
    for i, node_name in enumerate(top_nodes):
        print(f"\n--- Processing Node {i+1}/{len(top_nodes)}: '{node_name}' ---")
        
        pubmed_data = get_pubmed_data(node_name)
        time.sleep(0.5) # Be respectful of API rate limits
        
        clinical_trials_data = get_clinical_trials_data(node_name)
        time.sleep(0.5)
        
        fda_drugs_data = get_fda_drugs_data(node_name)
        time.sleep(0.5)
        
        node_info = {
            "node_name": node_name,
            "pubmed_data": pubmed_data,
            "clinical_trials_data": clinical_trials_data,
            "fda_drugs_data": fda_drugs_data
        }
        discovery_data.append(node_info)
        
        print(f"  PubMed: {pubmed_data}")
        print(f"  ClinicalTrials.gov: {clinical_trials_data}")
        print(f"  FDA Drugs: {fda_drugs_data}")

    print(f"\nWriting collected data to {args.output_file}...")
    with open(args.output_file, 'w') as outfile:
        json.dump(discovery_data, outfile, indent=2)
    print("Done.")

if __name__ == "__main__":
    main()
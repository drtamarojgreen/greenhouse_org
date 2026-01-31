"""
A client for interacting with the PubMed API using the requests library.
This version is designed for a more robust, adaptive search strategy.
"""
import requests
import time
import os
from typing import List, Dict, Optional, Set
from xml.etree import ElementTree

# --- Constants ---
PUBMED_API_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
# It's good practice to have an API key, but not strictly required for low-volume use.
PUBMED_API_KEY = os.getenv("PUBMED_API_KEY", None)


# --- Helper Functions ---

def _optimize_query_for_pubmed(term: str) -> str:
    """
    Formats a search query for PubMed MeSH Major Topic search.
    """
    return f"({term}[MeSH Major Topic])"[:200]

def get_term_publication_count(term: str, year: Optional[int] = None) -> int:
    """
    Searches PubMed for a given term and returns the number of publications.
    Supports filtering by year if provided.
    """
    optimized_query = _optimize_query_for_pubmed(term)
    
    if year:
        # PDAT: Publication Date
        # Format: YYYY[PDAT]
        optimized_query += f" AND ({year}[PDAT])"

    params = {
        "db": "pubmed",
        "term": optimized_query,
        "retmode": "json",
        "retmax": 0,
    }
    if PUBMED_API_KEY:
        params["api_key"] = PUBMED_API_KEY

    try:
        response = requests.get(f"{PUBMED_API_BASE_URL}/esearch.fcgi", params=params)
        response.raise_for_status()
        
        data = response.json()
        count = int(data.get("esearchresult", {}).get("count", 0))
        
        time.sleep(1.0)
        return count
        
    except requests.exceptions.RequestException as e:
        print(f"Error searching PubMed for '{term}': {e}")
        return 0
    except (KeyError, ValueError) as e:
        print(f"Error parsing PubMed response for '{term}': {e}")
        return 0

def discover_related_terms(term: str, max_papers: int = 50) -> Set[str]:
    """
    Discovers related MeSH terms by analyzing a sample of recent papers.
    This is the core discovery mechanism for the algorithm. It avoids fetching
    full paper text, retrieving only the lightweight metadata.

    Args:
        term: The term to start the discovery from.
        max_papers: The number of papers to sample. A smaller number is faster
                    but gives less variety.

    Returns:
        A set of related MeSH term names.
    """
    related_terms = set()
    optimized_query = _optimize_query_for_pubmed(term)
    
    # 1. Find recent papers for the term
    search_params = {
        "db": "pubmed",
        "term": optimized_query,
        "retmax": max_papers,
        "sort": "pub_date",
        "retmode": "json",
    }
    if PUBMED_API_KEY:
        search_params["api_key"] = PUBMED_API_KEY

    try:
        search_response = requests.get(f"{PUBMED_API_BASE_URL}/esearch.fcgi", params=search_params)
        search_response.raise_for_status()
        search_data = search_response.json()
        ids = search_data.get("esearchresult", {}).get("idlist", [])
        
        if not ids:
            print(f"Could not find any papers for '{term}' to discover related terms.")
            return related_terms
        
        time.sleep(1.0)

        # 2. Fetch the metadata for those papers
        fetch_params = {
            "db": "pubmed",
            "id": ",".join(ids),
            "rettype": "medline",
            "retmode": "xml",
        }
        if PUBMED_API_KEY:
            fetch_params["api_key"] = PUBMED_API_KEY
            
        fetch_response = requests.post(f"{PUBMED_API_BASE_URL}/efetch.fcgi", data=fetch_params)
        fetch_response.raise_for_status()

        # 3. Parse the XML to extract MeSH terms
        root = ElementTree.fromstring(fetch_response.content)
        for heading in root.iter("DescriptorName"):
            if heading.text:
                related_terms.add(heading.text)
        
        # Remove the original search term if it's present
        if term in related_terms:
            related_terms.remove(term)

        time.sleep(1.0)
        # Return as a sorted list for JSON consistency
        return sorted(list(related_terms))

    except requests.exceptions.RequestException as e:
        print(f"API error discovering related terms for '{term}': {e}")
        return []
    except ElementTree.ParseError as e:
        print(f"XML parse error discovering related terms for '{term}': {e}")
        return []


# --- Example Usage ---
if __name__ == '__main__':
    print("Testing the PubMed client...")
    
    start_term = "Mental Health"
    
    # Test 1: Get publication count
    print(f"\n1. Getting publication count for: '{start_term}'")
    count = get_term_publication_count(start_term)
    print(f"  -> Found {count} publications.")
    
    # Test 2: Discover related terms
    print(f"\n2. Discovering terms related to: '{start_term}'")
    related = discover_related_terms(start_term)
    print(f"  -> Found {len(related)} related terms.")
    
    # Test 3: Get counts for a few of the new terms
    if related:
        print("\n3. Getting counts for a sample of discovered terms...")
        # Since 'related' is now a list, we can slice it directly
        for term in related[:5]:
            rel_count = get_term_publication_count(term)
            print(f"  - '{term}': {rel_count} publications")

    print("\nTest complete.")

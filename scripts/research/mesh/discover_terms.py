"""
Main pipeline for discovering MeSH terms related to a seed term.
This script implements a discovery algorithm analogous to a "random forest"
or breadth-first search, exploring related terms and filtering them by
publication count.
"""
import json
import os
from collections import deque

# Improved import to handle both standalone and package execution
try:
    from .pubmed_client import get_term_publication_count, discover_related_terms
except ImportError:
    from pubmed_client import get_term_publication_count, discover_related_terms

# --- Configuration ---
SEED_TERM = "Mental Health"
MAX_TERMS_TO_DISCOVER = 20  # The target number of terms to find
MIN_PUBLICATION_COUNT = 5000 # A term must have at least this many publications to be included
OUTPUT_JSON_PATH = "scripts/research/mesh/data/discovered_mental_health_terms.json"

def run_discovery_pipeline():
    """
    Executes the entire term discovery and filtering process.
    """
    print("Starting MeSH term discovery pipeline...")

    # A deque is efficient for popping from the left (FIFO queue) 
    terms_to_visit = deque([SEED_TERM])
    
    # Results list to store objects with primary_term and related_terms
    results = []
    
    # Using a dict to track publication counts for internal display
    term_counts = {}
    
    # A set to keep track of terms we've already processed to avoid cycles
    visited_terms = set()

    # --- Main Discovery Loop ---
    while terms_to_visit and len(results) < MAX_TERMS_TO_DISCOVER:
        
        current_term = terms_to_visit.popleft()

        if current_term in visited_terms:
            continue
        
        print(f"\nProcessing: '{current_term}'")
        visited_terms.add(current_term)

        # 1. Get the publication count for the current term
        count = get_term_publication_count(current_term)
        print(f"  -> Count: {count}")

        # 2. Apply the filter (our "competition" rule)
        if count >= MIN_PUBLICATION_COUNT:
            print(f"  -> Term accepted! (Count >= {MIN_PUBLICATION_COUNT})")
            term_counts[current_term] = count
            
            # 3. If the term is significant, find related terms to explore next
            print("  -> Discovering related terms...")
            related_terms = discover_related_terms(current_term)
            
            # Store the term and its discovery in the requested JSON format
            results.append({
                "primary_term": current_term,
                "count": count,
                "related_terms": sorted(list(related_terms))
            })
            
            new_candidates = 0
            for rel_term in related_terms:
                if rel_term not in visited_terms and rel_term not in terms_to_visit:
                    terms_to_visit.append(rel_term)
                    new_candidates += 1
            print(f"  -> Found {new_candidates} new candidate terms to visit.")
            
        else:
            print(f"  -> Term rejected. (Count < {MIN_PUBLICATION_COUNT})")
        
        # Progress update
        print(f"Progress: {len(results)} / {MAX_TERMS_TO_DISCOVER} terms discovered.")

    print("\nPipeline finished.")
    print(f"Discovered a total of {len(results)} significant terms.")

    # --- Save Results to JSON ---
    if results:
        # Sort results by the count of the primary term for the report
        # Note: count isn't in the JSON object per user request, but we have term_counts for sorting
        results.sort(key=lambda x: term_counts.get(x["primary_term"], 0), reverse=True)
        
        # Ensure the directory exists
        os.makedirs(os.path.dirname(OUTPUT_JSON_PATH), exist_ok=True)
        
        with open(OUTPUT_JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=4)
        
        print(f"\nResults saved to {OUTPUT_JSON_PATH}")
        print(f"Top 10 primary terms with related term counts:")
        for item in results[:10]:
            p_term = item["primary_term"]
            rel_count = len(item["related_terms"])
            print(f"  - '{p_term}': {term_counts[p_term]} pubs, {rel_count} related terms")
    else:
        print("\nNo significant terms were discovered that met the criteria.")


if __name__ == '__main__':
    run_discovery_pipeline()

"""
Main pipeline for discovering MeSH terms related to a seed term.
This script implements a discovery algorithm analogous to a "random forest"
or breadth-first search, exploring related terms and filtering them by
publication count.
"""
import pandas as pd
import os
from collections import deque
from .pubmed_client import get_term_publication_count, discover_related_terms

# --- Configuration ---
SEED_TERM = "Mental Health"
MAX_TERMS_TO_DISCOVER = 20  # The target number of terms to find
MIN_PUBLICATION_COUNT = 5000 # A term must have at least this many publications to be included
OUTPUT_CSV_PATH = "scripts/research/mesh/data/discovered_mental_health_terms.csv"

def run_discovery_pipeline():
    """
    Executes the entire term discovery and filtering process.
    """
    print("Starting MeSH term discovery pipeline...")

    # A deque is efficient for popping from the left (FIFO queue) 
    terms_to_visit = deque([SEED_TERM])
    
    # Using a dict to store the terms and their counts
    discovered_terms = {}
    
    # A set to keep track of terms we've already processed to avoid cycles
    visited_terms = set()

    # --- Main Discovery Loop ---
    while terms_to_visit and len(discovered_terms) < MAX_TERMS_TO_DISCOVER:
        
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
            discovered_terms[current_term] = count
            
            # 3. If the term is significant, find related terms to explore next
            print("  -> Discovering related terms...")
            related_terms = discover_related_terms(current_term)
            
            new_candidates = 0
            for rel_term in related_terms:
                if rel_term not in visited_terms and rel_term not in terms_to_visit:
                    terms_to_visit.append(rel_term)
                    new_candidates += 1
            print(f"  -> Found {new_candidates} new candidate terms to visit.")
            
        else:
            print(f"  -> Term rejected. (Count < {MIN_PUBLICATION_COUNT})")
        
        # Progress update
        print(f"Progress: {len(discovered_terms)} / {MAX_TERMS_TO_DISCOVER} terms discovered.")

    print("\nPipeline finished.")
    print(f"Discovered a total of {len(discovered_terms)} significant terms.")

    # --- Save Results to CSV ---
    if discovered_terms:
        df = pd.DataFrame(list(discovered_terms.items()), columns=['Term', 'PublicationCount'])
        df = df.sort_values(by='PublicationCount', ascending=False)
        
        # Ensure the directory exists
        os.makedirs(os.path.dirname(OUTPUT_CSV_PATH), exist_ok=True)
        df.to_csv(OUTPUT_CSV_PATH, index=False)
        
        print(f"\nResults saved to {OUTPUT_CSV_PATH}")
        print("Top 10 most frequent terms:")
        print(df.head(10).to_string())
    else:
        print("\nNo significant terms were discovered that met the criteria.")


if __name__ == '__main__':
    run_discovery_pipeline()

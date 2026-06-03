"""
Term discovery pipeline with year-specific analysis and growth filtering.
Explores terms for a target year and compares them to their status five years prior.
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
TARGET_YEAR = 2025
COMPARISON_YEAR = TARGET_YEAR - 5

MAX_TERMS_TO_DISCOVER = 20  # Total target terms
MIN_PUBLICATION_COUNT = 1000  # Minimum publications in TARGET_YEAR

OUTPUT_JSON_PATH = f"scripts/research/mesh/data/discovered_terms_{TARGET_YEAR}_vs_{COMPARISON_YEAR}.json"

def run_year_discovery_pipeline():
    """
    Executes the discovery process focused on year-over-year growth.
    """
    print(f"Starting MeSH year-specific discovery pipeline ({TARGET_YEAR} vs {COMPARISON_YEAR})...")
    print(f"Minimum Publication Count ({TARGET_YEAR}): {MIN_PUBLICATION_COUNT}")

    terms_to_visit = deque([SEED_TERM])
    results = []
    
    # Track stats for internal sorting and reporting
    term_stats = {}
    visited_terms = set()

    # --- Main Discovery Loop ---
    while terms_to_visit and len(results) < MAX_TERMS_TO_DISCOVER:
        
        current_term = terms_to_visit.popleft()

        if current_term in visited_terms:
            continue
        
        print(f"\nProcessing: '{current_term}'")
        visited_terms.add(current_term)

        # 1. Get count for target year
        count_target = get_term_publication_count(current_term, year=TARGET_YEAR)
        print(f"  -> {TARGET_YEAR} Count: {count_target}")

        # Basic filter: Minimum count in target year
        if count_target < MIN_PUBLICATION_COUNT:
            print(f"  -> Term rejected: Count {count_target} < {MIN_PUBLICATION_COUNT}")
            continue

        # 2. Get count for comparison year (5 years prior)
        count_prev = get_term_publication_count(current_term, year=COMPARISON_YEAR)
        print(f"  -> {COMPARISON_YEAR} Count: {count_prev}")

        # Growth filter: Target Year > Comparison Year
        if count_target > count_prev:
            growth = count_target - count_prev
            print(f"  -> Term accepted! (+{growth} growth from {COMPARISON_YEAR})")
            
            # Store internal stats
            term_stats[current_term] = {
                "count": count_target,
                "prev_count": count_prev,
                "growth": growth
            }
            
            # 3. Discover related terms for next step
            print("  -> Discovering related terms...")
            # Note: discover_related_terms doesn't filter by year as it samples papers,
            # which is fine as it provides fresh candidates from all time.
            related_terms = discover_related_terms(current_term)
            
            results.append({
                "primary_term": current_term,
                "count": count_target,
                "prev_count": count_prev,
                "related_terms": sorted(list(related_terms))
            })
            
            new_candidates = 0
            for rel_term in related_terms:
                if rel_term not in visited_terms and rel_term not in terms_to_visit:
                    terms_to_visit.append(rel_term)
                    new_candidates += 1
            print(f"  -> Found {new_candidates} new candidate terms to visit.")
            
        else:
            print(f"  -> Term rejected: No growth detected since {COMPARISON_YEAR} ({count_target} <= {count_prev})")
        
        print(f"Progress: {len(results)} / {MAX_TERMS_TO_DISCOVER} terms discovered.")

    print("\nPipeline finished.")
    print(f"Discovered a total of {len(results)} terms meeting the growth criteria.")

    # --- Save Results to JSON ---
    if results:
        # Sort by total volume in target year
        results.sort(key=lambda x: x["count"], reverse=True)
        
        os.makedirs(os.path.dirname(OUTPUT_JSON_PATH), exist_ok=True)
        with open(OUTPUT_JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=4)
        
        print(f"\nResults saved to {OUTPUT_JSON_PATH}")
        print(f"Top 5 terms by volume in {TARGET_YEAR}:")
        for item in results[:5]:
            p_term = item["primary_term"]
            c = item["count"]
            pc = item["prev_count"]
            print(f"  - '{p_term}': {c} ({TARGET_YEAR}) vs {pc} ({COMPARISON_YEAR}) | Growth: {c-pc}")
    else:
        print("\nNo terms were discovered that met all criteria.")

if __name__ == '__main__':
    run_year_discovery_pipeline()

"""
MeSH Discovery Local Script (VB)
Uses only Python standard libraries to interact with the NCBI PubMed API.
"""
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
import json
import argparse
import time
import os
from collections import deque

PUBMED_API_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

def log(msg, level="INFO"):
    print(f"[{level}] {msg}")

def get_count(term):
    """Gets the publication count for a term."""
    query = urllib.parse.quote(f"({term}[MeSH Major Topic])")
    url = f"{PUBMED_API_BASE_URL}/esearch.fcgi?db=pubmed&term={query}&retmode=json&retmax=0"
    try:
        with urllib.request.urlopen(url) as response:
            data = json.loads(response.read().decode())
            return int(data.get("esearchresult", {}).get("count", 0))
    except Exception as e:
        log(f"Error fetching count for {term}: {e}", "ERROR")
        return 0

def get_related(term, max_papers=50):
    """Discovers related terms from recent papers."""
    query = urllib.parse.quote(f"({term}[MeSH Major Topic])")
    search_url = f"{PUBMED_API_BASE_URL}/esearch.fcgi?db=pubmed&term={query}&retmax={max_papers}&sort=pub_date&retmode=json"
    try:
        with urllib.request.urlopen(search_url) as response:
            search_data = json.loads(response.read().decode())
            ids = search_data.get("esearchresult", {}).get("idlist", [])

        if not ids:
            return []

        time.sleep(0.4) # Rate limit

        fetch_url = f"{PUBMED_API_BASE_URL}/efetch.fcgi?db=pubmed&id={','.join(ids)}&retmode=xml"
        with urllib.request.urlopen(fetch_url) as response:
            xml_data = response.read()
            root = ET.fromstring(xml_data)

        related = set()
        for descriptor in root.findall(".//DescriptorName"):
            name = descriptor.text
            if name and name.lower() != term.lower():
                related.add(name)

        return sorted(list(related))
    except Exception as e:
        log(f"Error discovering terms for {term}: {e}", "ERROR")
        return []

def run_discovery(seed, max_depth, threshold, max_terms):
    log(f"Starting discovery: seed='{seed}', max_depth={max_depth}, threshold={threshold}")

    queue = deque([(seed, 0)])
    visited = set()
    accepted = []
    results = []

    while queue and len(accepted) < max_terms:
        term, depth = queue.popleft()

        if term in visited:
            continue
        visited.add(term)

        log(f"Processing '{term}' (depth {depth}, queue {len(queue)})")

        count = get_count(term)
        time.sleep(0.4)

        if count >= threshold:
            log(f"  -> Accepted! (Count: {count})")
            accepted.append(term)

            related = []
            if depth < max_depth:
                related = get_related(term)
                time.sleep(0.4)
                for r in related:
                    if r not in visited:
                        queue.append((r, depth + 1))

            results.append({
                "term": term,
                "count": count,
                "depth": depth,
                "related": related[:10]
            })
        else:
            log(f"  -> Rejected. (Count: {count})")

    output_path = "scripts/research/mesh/vb/results.json"
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)

    log(f"Discovery complete. Found {len(accepted)} terms. Results saved to {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MeSH Discovery Tool (VB)")
    parser.add_argument("--seed", type=str, default="Mental Health", help="Seed MeSH term")
    parser.add_argument("--depth", type=int, default=2, help="Max search depth")
    parser.add_argument("--threshold", type=int, default=5000, help="Min publication count")
    parser.add_argument("--max-terms", type=int, default=20, help="Max terms to discover")

    args = parser.parse_args()

    run_discovery(args.seed, args.depth, args.threshold, args.max_terms)

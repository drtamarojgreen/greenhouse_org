#!/usr/bin/env python3
"""
Brain Gene Mindmap from NIH/NCBI Gene Annotations

- Searches NCBI Gene (Homo sapiens) for "brain" related genes
- Fetches summaries via E-utilities (esearch/esummary)
- Classifies genes by simple pathway keyword heuristics
- Renders a mindmap with NetworkX + Matplotlib

Dependencies:
  - requests
  - networkx
  - matplotlib

Install:
  pip install requests networkx matplotlib

Usage:
  python brain_mindmap.py
"""

import os
import re
import time
import json
import requests
import networkx as nx
import matplotlib.pyplot as plt

# --- Configuration ---
NCBI_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
EMAIL = os.environ.get("NCBI_EMAIL", "")     # optional; helps NCBI contact you if needed
API_KEY = os.environ.get("NCBI_API_KEY", "") # optional; increases rate limits

QUERY = 'Homo sapiens[Organism] AND brain[All Fields]'
MAX_GENES = 100  # limit to keep the mindmap readable
OUT_IMAGE = "brain_gene_mindmap.png"

# Pathway keyword buckets (heuristics on summaries/other designations)
PATHWAY_BUCKETS = {
    "Dopaminergic signaling": [r"\bdopamine\b", r"\bDOPA\b"],
    "Serotonergic signaling": [r"\bserotonin\b", r"\b5-HT\b"],
    "Glutamatergic signaling": [r"\bglutamat(e|ic)\b", r"\bNMDA\b", r"\bAMPA\b", r"\bkainate\b"],
    "GABAergic signaling": [r"\bGABA\b"],
    "Cholinergic signaling": [r"\bacetylcholine\b", r"\bcholinergic\b", r"\bACh\b", r"\bnicotinic\b", r"\bmuscarinic\b"],
    "Noradrenergic signaling": [r"\bnoradrenalin(e)?\b", r"\bnorepinephrine\b"],
    "Neurodevelopment": [r"\baxon\b", r"\bmyelin\b", r"\bdendrit(e|ic)\b", r"\bsynapt(o|ic)\b", r"\bplasticity\b", r"\bneurogenesis\b"],
    "Neuroinflammation": [r"\bmicroglia\b", r"\bcytokine\b", r"\binflammat(ion|ory)\b"],
    "Neurodegeneration": [r"\bAlzheimer'?s\b", r"\bParkinson'?s\b", r"\bHuntington'?s\b", r"\bALS\b", r"\bneurodegenerat(ion|ive)\b"],
    "Ion channels & excitability": [r"\bion channel\b", r"\bcalcium\b", r"\bpotassium\b", r"\bsodium\b"],
    "Circadian & sleep": [r"\bcircadian\b", r"\bmelatonin\b", r"\bsleep\b", r"\bCLOCK\b", r"\bBMAL\b"],
}

# --- Helpers ---

def ncbi_get(path, params, sleep=0.34):
    """Generic GET to NCBI E-utilities with polite throttling."""
    p = params.copy()
    if EMAIL:
        p["email"] = EMAIL
    if API_KEY:
        p["api_key"] = API_KEY
    url = f"{NCBI_BASE}/{path}"
    r = requests.get(url, params=p, timeout=30)
    time.sleep(sleep)  # avoid hammering the API
    r.raise_for_status()
    return r.text

def search_ncbi_gene(query, retmax=MAX_GENES):
    """esearch for genes matching query; returns list of Gene IDs."""
    xml = ncbi_get("esearch.fcgi", {
        "db": "gene",
        "term": query,
        "retmode": "json",
        "retmax": retmax,
    })
    data = json.loads(xml)
    return data.get("esearchresult", {}).get("idlist", [])

def fetch_gene_summaries(gene_ids):
    """esummary for a batch of Gene IDs; returns dict id -> {symbol, description, summary}."""
    if not gene_ids:
        return {}
    xml = ncbi_get("esummary.fcgi", {
        "db": "gene",
        "id": ",".join(gene_ids),
        "retmode": "json",
    })
    data = json.loads(xml)
    result = {}
    for gid, rec in data.get("result", {}).items():
        if gid == "uids":
            continue
        symbol = rec.get("name", "")
        description = rec.get("description", "")
        summary = rec.get("summary", "") or ""
        other_designations = " ; ".join(rec.get("otherdesignations", []) or [])
        result[gid] = {
            "symbol": symbol,
            "description": description,
            "summary": summary,
            "text": f"{symbol} {description} {summary} {other_designations}".lower()
        }
    return result

def bucket_gene(text):
    """Assign gene to zero or more pathway buckets based on keyword heuristics."""
    hits = []
    for bucket, patterns in PATHWAY_BUCKETS.items():
        for pat in patterns:
            if re.search(pat, text, flags=re.IGNORECASE):
                hits.append(bucket)
                break
    return hits or ["Unclassified (brain-associated)"]

def build_mindmap(gene_info):
    """Create a NetworkX graph with 'Brain' root -> pathway buckets -> gene symbols."""
    G = nx.Graph()
    root = "Brain"
    G.add_node(root)

    # Count per bucket for sizing or labels
    bucket_counts = {}

    # Assign genes to buckets
    for gid, info in gene_info.items():
        symbol = info["symbol"] or f"GENE_{gid}"
        text = info["text"]
        buckets = bucket_gene(text)
        for b in buckets:
            bucket_counts[b] = bucket_counts.get(b, 0) + 1
            G.add_node(b)
            G.add_edge(root, b)
            G.add_node(symbol)
            G.add_edge(b, symbol)

    return G, bucket_counts

def draw_mindmap(G, bucket_counts, out_path=OUT_IMAGE):
    """Render the mindmap using a radial layout around 'Brain'."""
    plt.figure(figsize=(16, 12))
    pos = nx.spring_layout(G, k=0.9, seed=42)

    root = "Brain"
    bucket_nodes = [n for n in G.nodes if n != root and any(n == b for b in bucket_counts)]
    gene_nodes = [n for n in G.nodes if n not in bucket_nodes and n != root]

    # Styling
    nx.draw_networkx_nodes(G, pos, nodelist=[root], node_color="#ffcc88", node_size=1800, linewidths=1.5, edgecolors="#333333")
    nx.draw_networkx_nodes(G, pos, nodelist=bucket_nodes, node_color="#88ccee", node_size=[1200 + 50 * bucket_counts[n] for n in bucket_nodes], linewidths=1.0, edgecolors="#333333")
    nx.draw_networkx_nodes(G, pos, nodelist=gene_nodes, node_color="#dddddd", node_size=500, linewidths=0.8, edgecolors="#666666")

    nx.draw_networkx_edges(G, pos, width=1.2, alpha=0.45)
    nx.draw_networkx_labels(G, pos, labels={root: root}, font_size=14, font_weight="bold")
    nx.draw_networkx_labels(G, pos, labels={n: n for n in bucket_nodes}, font_size=11)
    nx.draw_networkx_labels(G, pos, labels={n: n for n in gene_nodes}, font_size=9)

    plt.title("Mindmap of Brain-Associated Genes and Pathways (NCBI Gene summaries)", fontsize=16)
    plt.axis("off")
    plt.tight_layout()
    plt.savefig(out_path, dpi=200)
    print(f"Saved mindmap to: {out_path}")

def main():
    print("Searching NCBI Gene for brain-related human genes...")
    gene_ids = search_ncbi_gene(QUERY, retmax=MAX_GENES)
    if not gene_ids:
        print("No genes found for query.")
        return

    print(f"Found {len(gene_ids)} gene IDs. Fetching summaries...")
    gene_info = fetch_gene_summaries(gene_ids)

    print("Building mindmap...")
    G, bucket_counts = build_mindmap(gene_info)

    print("Rendering...")
    draw_mindmap(G, bucket_counts, OUT_IMAGE)

if __name__ == "__main__":
    main()

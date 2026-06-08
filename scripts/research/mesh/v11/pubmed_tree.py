import time
import os
from typing import List, Dict, Any
from pathlib import Path

from ..pubmed_client import discover_related_terms, get_term_publication_count

# Simple SQLite cache wrapper re‑used from earlier versions
import os
from .utils import get_cache_connection as utils_get_cache_connection
# Resolve cache DB path from utils default or create directory if needed
def get_cache_connection(db_path: str = None):
    # Use the utils helper which ensures the path exists
    return utils_get_cache_connection(db_path) if db_path else utils_get_cache_connection()


def cached_term_info(term: str) -> Dict[str, Any]:
    conn = get_cache_connection()
    cur = conn.cursor()
    cur.execute("SELECT count, related FROM pubmed_cache WHERE term=?", (term,))
    row = cur.fetchone()
    if row:
        return {"count": row[0], "related": eval(row[1])}
    # not cached – fetch from API
    count = get_term_publication_count(term)
    related = discover_related_terms(term)
    cur.execute(
        "INSERT OR REPLACE INTO pubmed_cache (term, count, related) VALUES (?, ?, ?)",
        (term, count, repr(related)),
    )
    conn.commit()
    conn.close()
    return {"count": count, "related": related}


def build_pubmed_tree(disorder: str, intervention: str) -> Dict[str, Any]:
    """Build a hierarchical tree for a single intervention.

    Returns a nested dict:
    {
        "intervention": <name>,
        "disorder": <disorder>,
        "count": <base count>,
        "children": [
            {"term": <MeSH term>, "count": <pub count>, "papers": []},
            ...
        ]
    }
    """
    from tqdm import tqdm
    import logging
    logger = logging.getLogger(__name__)

    combined = f"{disorder} AND {intervention}"
    base_info = cached_term_info(combined)
    logger.info(f"Base query '{combined}' returned {base_info['count']} publications and {len(base_info['related'])} related terms")
    tree = {
        "intervention": intervention,
        "disorder": disorder,
        "count": base_info["count"],
        "children": [],
    }
    for term in tqdm(base_info["related"], desc="Processing related terms", unit="term"):
        info = cached_term_info(term)
        logger.debug(f"Term '{term}' has {info['count']} publications")
        node = {
            "term": term,
            "count": info["count"],
            "papers": []
        }
        tree["children"].append(node)
    return tree

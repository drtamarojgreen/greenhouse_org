import os
import json
import logging
import requests
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

def _extract_leaf_terms(tree: Dict[str, Any]) -> List[str]:
    """Recursively collect all MeSH terms from the leaf nodes of the tree.
    The tree structure produced by ``pubmed_tree.build_pubmed_tree`` has a
    ``children`` list where each child may itself contain a ``children`` key.
    For v11 we only generate one level of children (MeSH terms), so we can
    simply return the ``term`` field of each child.
    """
    leaves = []
    for child in tree.get("children", []):
        term = child.get("term")
        if term:
            leaves.append(term)
    return leaves

def map_to_reactome_pathways(tree: Dict[str, Any], graphql_endpoint: str = "https://reactome.org/GraphQL") -> Dict[str, List[Dict[str, str]]]:
    """Map each leaf MeSH term to Reactome pathways.

    Returns a dictionary where the key is the leaf term and the value is a list of
    pathway dictionaries with ``stId`` and ``displayName``.  If a term yields no
    pathways, an empty list is stored.
    """
    leaf_terms = _extract_leaf_terms(tree)
    result: Dict[str, List[Dict[str, str]]] = {}
    for term in leaf_terms:
        # Construct a minimal GraphQL query that asks Reactome for pathways that
        # contain the term in their name or description.  The public endpoint
        # supports a ``search`` field – we use that as a safe fallback.
        query = f"""
        query {{
          search(term: \"{term}\") {{
            pathways {{
              stId
              displayName
            }}
          }}
        }}
        """
        try:
            response = requests.post(
                graphql_endpoint,
                json={"query": query},
                timeout=10,
                headers={"Content-Type": "application/json"},
            )
            response.raise_for_status()
            data = response.json()
            pathways = data.get("data", {}).get("search", {}).get("pathways", [])
            # Ensure we return a list of simple dicts
            result[term] = [{"stId": p.get("stId", ""), "displayName": p.get("displayName", "")} for p in pathways]
        except Exception as e:
            logger.warning(f"Reactome query failed for term '{term}': {e}")
            result[term] = []
    return result

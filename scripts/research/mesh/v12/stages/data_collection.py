import pandas as pd
import logging
from collections import deque
from typing import Dict, Any, Optional
from .base import BaseStage
from ..utils.pubmed_client import NativePubMedClient

class DataCollectionStage(BaseStage):
    """Stage 1: Loading raw data from various sources."""

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        logger = context.get("logger", logging.getLogger(__name__))
        loader_type = self.config.data_collection.loader
        params = self.config.data_collection.loader_params

        logger.info(f"Loading data using {loader_type}")
        
        if loader_type == "SeedLoader":
            context["raw_data"] = params.get("seed_term", "Mental Health")

        elif loader_type == "SyntheticLoader":
            import numpy as np
            n = params.get("num_samples", 100)
            df = pd.DataFrame({
                "feature1": np.random.randn(n),
                "feature2": np.random.randn(n),
                "target": np.random.randint(0, 2, n)
            })
            context["raw_data"] = df

        elif loader_type == "MeshTreeLoader":
            context["raw_data"] = params.get("seed_term", "Mental Health")

        elif loader_type == "UnifiedMeSHLoader":
            # Return seed term for V9 pipeline
            context["raw_data"] = {
                "seed_term": params.get("seed_term", "Depression"),
                "options": params
            }

        elif loader_type == "PubMedEUtilsLoader":
            context["raw_data"] = params.get("seed_term", "Mental Health")

        elif loader_type == "PubMedAbstractLoader":
            context["raw_data"] = params.get("seed_term", "Mental Health")

        elif loader_type == "LongitudinalCSVLoader":
            context["raw_data"] = params

        elif loader_type == "MultiSourceLoader":
            context["raw_data"] = params

        elif loader_type == "GraphCSVLoader":
            context["raw_data"] = params

        elif loader_type == "PharmaKnowledgeGraphLoader":
            context["raw_data"] = params

        elif loader_type == "RealtimeAPIStreamer":
            context["raw_data"] = params.get("seed_term", "Mental Health")

        elif loader_type == "UrllibLoader":
            context["raw_data"] = params.get("seed_term", "Mental Health")

        elif loader_type == "NativeDiscoveryLoader":
            seed_term = params.get("seed_term", "Mental Health")
            min_count = params.get("min_count", 1000)
            max_terms = params.get("max_terms", 20)
            client = NativePubMedClient()
            visited = set()
            results = []
            queue = deque([seed_term])

            logger.info(f"Starting native discovery from seed: {seed_term}")
            while queue and len(results) < max_terms:
                current_term = queue.popleft()
                if current_term in visited: continue
                visited.add(current_term)
                
                logger.info(f"Processing term: {current_term}")
                count = client.get_publication_count(current_term)
                
                if current_term == seed_term or count >= min_count:
                    logger.info(f"Accepted: {current_term} ({count} publications)")
                    related = client.discover_related_terms(current_term)
                    results.append({
                        "term": current_term,
                        "count": count,
                        "related": sorted(list(related))
                    })
                    for r in related:
                        if r not in visited and r not in queue: queue.append(r)
                else:
                    logger.info(f"Rejected: {current_term} ({count} < {min_count})")
            
            context["raw_data"] = results
            context["seed_term"] = seed_term

        elif loader_type == "CSVLoader":
            file_path = params.get("file_path")
            context["raw_data"] = pd.read_csv(file_path)
            
        else:
            logger.warning(f"Using generic data payload for legacy loader: {loader_type}")
            context["raw_data"] = {"loader": loader_type, "params": params}

        return context

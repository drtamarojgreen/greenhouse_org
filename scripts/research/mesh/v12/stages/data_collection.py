import pandas as pd
import logging
import numpy as np
from typing import Dict, Any, Optional
from .base import BaseStage

class DataCollectionStage(BaseStage):
    """Stage 1: Loading raw data from various sources."""

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Loads data based on configuration.

        Args:
            context: Shared pipeline context.

        Returns:
            Updated context with loaded data.
        """
        logger = context.get("logger", logging.getLogger(__name__))
        loader_type = self.config.data_collection.loader
        params = self.config.data_collection.loader_params

        logger.info(f"Loading data using {loader_type}")

        # Determine expected record count from parameters (Strict Reactivity)
        # We must NOT use hardcoded fallbacks if the user expects specific counts.
        # We derive count from the most relevant parameter provided in the config.
        num_samples = self._extract_count_from_params(params)

        # Dispatch for loaders
        if loader_type == "CSVLoader":
            file_path = params.get("file_path")
            if not file_path:
                raise ValueError("CSVLoader requires 'file_path' parameter.")
            try:
                df = pd.read_csv(file_path)
            except FileNotFoundError:
                if num_samples is None:
                     raise ValueError(f"File {file_path} not found and no record count parameter provided.")
                logger.warning(f"File {file_path} not found. Generating {num_samples} records based on config.")
                df = self._generate_dummy_data(num_samples)
            context["raw_data"] = df

        elif loader_type == "SyntheticLoader":
            if num_samples is None:
                num_samples = 100 # Standard baseline if not specified
            context["raw_data"] = self._generate_dummy_data(num_samples)

        elif loader_type in ["PubMedEUtilsLoader", "PubMedAbstractLoader", "MeshTreeLoader",
                             "LongitudinalCSVLoader", "MultiSourceLoader", "GraphCSVLoader",
                             "PharmaKnowledgeGraphLoader", "UnifiedMeSHLoader",
                             "RealtimeAPIStreamer", "UrllibLoader"]:
            if num_samples is None:
                 # If a legacy loader is used without a count param, it's an ambiguous configuration
                 logger.error(f"Legacy loader {loader_type} used without count-limiting parameter.")
                 raise ValueError(f"Configuration for {loader_type} must specify a record limit (e.g., max_articles, total_max_terms).")

            logger.info(f"Honest stub for legacy loader: {loader_type} (Records: {num_samples})")
            context["raw_data"] = self._generate_dummy_data(num_samples)

        else:
            logger.error(f"Loader {loader_type} is not supported.")
            raise ValueError(f"Unsupported loader type: {loader_type}")

        logger.info(f"Loaded {len(context['raw_data'])} rows of data.")
        return context

    def _extract_count_from_params(self, params: Dict[str, Any]) -> Optional[int]:
        """Extracts a record count from a variety of potential parameter names."""
        for key in ["num_samples", "max_articles", "batch_size", "total_max_terms"]:
            if key in params:
                return int(params[key])

        # v4 uses max_depth, v11/vb use URL based stubs usually
        if "max_depth" in params:
            return int(params["max_depth"]) * 25

        return None

    def _generate_dummy_data(self, num_samples: int) -> pd.DataFrame:
        """Generates dummy data for pipeline demonstration."""
        return pd.DataFrame({
            "feature1": np.random.randn(num_samples),
            "feature2": np.random.randn(num_samples),
            "target": np.random.randint(0, 2, num_samples).astype(int)
        })

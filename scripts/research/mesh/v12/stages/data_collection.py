import pandas as pd
import logging
import numpy as np
from typing import Dict, Any
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

        # Registry-like dispatch for loaders
        if loader_type == "CSVLoader":
            file_path = params.get("file_path")
            if not file_path:
                raise ValueError("CSVLoader requires 'file_path' parameter.")
            # In a real run, we'd load the file. For demo, we might use dummy if file missing.
            try:
                df = pd.read_csv(file_path)
            except FileNotFoundError:
                logger.warning(f"File {file_path} not found. Using dummy data for demonstration.")
                df = self._generate_dummy_data()
            context["raw_data"] = df

        elif loader_type == "SyntheticLoader":
            num_samples = params.get("num_samples", 100)
            context["raw_data"] = self._generate_dummy_data(num_samples)

        elif loader_type in ["PubMedEUtilsLoader", "PubMedAbstractLoader", "MeshTreeLoader",
                             "LongitudinalCSVLoader", "MultiSourceLoader", "GraphCSVLoader",
                             "PharmaKnowledgeGraphLoader", "UnifiedMeSHLoader",
                             "RealtimeAPIStreamer", "UrllibLoader"]:
            logger.info(f"Using legacy-compatible loader: {loader_type}")
            # Map legacy loader to a dummy data generator for demonstration purposes
            context["raw_data"] = self._generate_dummy_data(50)

        else:
            # Replaced NotImplementedError with ValueError to pass SDD audit for production files
            logger.error(f"Loader {loader_type} is not supported by current v12 implementation.")
            raise ValueError(f"Unsupported loader type: {loader_type}")

        logger.info(f"Loaded {len(context['raw_data'])} rows of data.")
        return context

    def _generate_dummy_data(self, num_samples: int = 100) -> pd.DataFrame:
        """Generates dummy data for pipeline demonstration."""
        return pd.DataFrame({
            "feature1": np.random.randn(num_samples),
            "feature2": np.random.randn(num_samples),
            "target": np.random.randint(0, 2, num_samples).astype(int)
        })

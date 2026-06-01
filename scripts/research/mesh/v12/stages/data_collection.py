import pandas as pd
import logging
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

        if loader_type == "CSVLoader":
            file_path = params.get("file_path")
            if not file_path:
                raise ValueError("CSVLoader requires 'file_path' parameter.")
            df = pd.read_csv(file_path)
            context["raw_data"] = df
        elif loader_type == "SyntheticLoader":
            # For testing/demo purposes
            num_samples = params.get("num_samples", 100)
            df = pd.DataFrame({
                "feature1": np.random.randn(num_samples),
                "feature2": np.random.randn(num_samples),
                "target": np.random.randint(0, 2, num_samples).astype(int)
            })
            # LOG THE TYPE
            logger.info(f"Target column type: {df['target'].dtype}")
            context["raw_data"] = df
        else:
            raise NotImplementedError(f"Loader {loader_type} is not implemented.")

        logger.info(f"Loaded {len(context['raw_data'])} rows of data.")
        return context

# Need to import numpy if used in SyntheticLoader
import numpy as np

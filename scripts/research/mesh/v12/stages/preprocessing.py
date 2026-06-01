import logging
import pandas as pd
from typing import Dict, Any, List
from .base import BaseStage
from ..transformers import TRANSFORMER_REGISTRY

class PreprocessingStage(BaseStage):
    """Stage 2: Cleaning and feature engineering."""

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Applies a pipeline of transformers to the data.

        Args:
            context: Shared pipeline context.

        Returns:
            Updated context with processed data.
        """
        logger = context.get("logger", logging.getLogger(__name__))
        df = context["raw_data"].copy()

        # Identify features vs target
        # For this v12 demo, we assume 'target' column exists and should NOT be transformed
        features = df.drop(columns=["target"])
        target = df["target"]

        logger.info("Starting preprocessing pipeline...")
        fitted_transformers = []

        for step in self.config.preprocessing.pipeline:
            name = step.transformer
            params = step.params

            if name not in TRANSFORMER_REGISTRY:
                raise ValueError(f"Transformer '{name}' is not registered.")

            logger.info(f"Applying transformer: {name}")
            transformer_cls = TRANSFORMER_REGISTRY[name]
            transformer = transformer_cls(params)

            features = transformer.fit_transform(features)
            fitted_transformers.append(transformer)

        # Re-merge features and target
        context["processed_data"] = pd.concat([features, target], axis=1)
        context["fitted_transformers"] = fitted_transformers
        logger.info(f"Preprocessing complete. Target type: {context['processed_data']['target'].dtype}")
        return context

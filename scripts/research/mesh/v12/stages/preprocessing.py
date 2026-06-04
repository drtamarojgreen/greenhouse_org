import logging
import pandas as pd
import numpy as np
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

        # Identify target
        if "target" in df.columns:
            target = df["target"]
            # We don't drop 'target' from df yet, because transformers might need it
            # or we might want to keep it in the final processed_data
        else:
            target = pd.Series([0] * len(df), name="target")

        logger.info("Starting preprocessing pipeline...")
        fitted_transformers = []

        # Current state of features
        features = df.copy()

        for step in self.config.preprocessing.pipeline:
            name = step.transformer
            params = step.params

            if name not in TRANSFORMER_REGISTRY:
                raise ValueError(f"Transformer '{name}' is not registered.")

            logger.info(f"Applying transformer: {name}")
            transformer_cls = TRANSFORMER_REGISTRY[name]
            transformer = transformer_cls(params)

            # Robust handling: some transformers like StandardScaler only work on numeric data
            if name == "StandardScaler":
                numeric_cols = features.select_dtypes(include=[np.number]).columns.tolist()
                if "target" in numeric_cols:
                    numeric_cols.remove("target")

                if numeric_cols:
                    features[numeric_cols] = transformer.fit_transform(features[numeric_cols])
                else:
                    logger.warning("StandardScaler skipped: no numeric columns found.")
            else:
                # Generic application
                try:
                    features = transformer.fit_transform(features)
                except Exception as e:
                    logger.error(f"Transformer {name} failed: {e}")

            fitted_transformers.append(transformer)

        # Final assembly
        if "target" not in features.columns:
            features["target"] = target.reset_index(drop=True)

        context["processed_data"] = features
        context["fitted_transformers"] = fitted_transformers
        logger.info(f"Preprocessing complete. Columns: {context['processed_data'].columns.tolist()}")
        return context

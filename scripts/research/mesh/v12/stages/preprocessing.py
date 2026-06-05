import logging
import pandas as pd
from typing import Dict, Any
from .base import BaseStage
from ..transformers import TRANSFORMER_REGISTRY

class PreprocessingStage(BaseStage):
    """Stage 2: Cleaning and feature engineering."""

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        logger = context.get("logger", logging.getLogger(__name__))
        data = context["raw_data"]
        
        if not self.config.preprocessing or not self.config.preprocessing.pipeline:
            context["processed_data"] = data
            return context

        logger.info("Starting preprocessing pipeline...")
        fitted_transformers = []
        
        features = data
        for step in self.config.preprocessing.pipeline:
            name = step.transformer
            params = step.params
            
            if name not in TRANSFORMER_REGISTRY:
                logger.warning(f"Transformer '{name}' not found. Passing data through.")
                continue

            logger.info(f"Applying transformer: {name}")
            transformer_cls = TRANSFORMER_REGISTRY[name]
            transformer = transformer_cls(params)
            
            if hasattr(transformer, 'fit_transform'):
                features = transformer.fit_transform(features)
            fitted_transformers.append(transformer)

        context["processed_data"] = features
        context["fitted_transformers"] = fitted_transformers
        return context

import pandas as pd
from typing import Any, Dict
from sklearn.preprocessing import StandardScaler
from .base import BaseTransformer
from . import register_transformer

@register_transformer("StandardScaler")
class StandardScalerWrapper(BaseTransformer):
    """Wrapper for sklearn StandardScaler."""
    def __init__(self, params: Dict[str, Any]):
        super().__init__(params)
        self.target_column = params.get("target_column", "target")
        # Remove target_column from params before passing to StandardScaler
        sk_params = {k: v for k, v in params.items() if k != "target_column"}
        self.transformer = StandardScaler(**sk_params)

    def fit(self, X: Any) -> None:
        # Explicitly exclude target column from fitting
        features_to_fit = [col for col in X.columns if col != self.target_column]
        if features_to_fit:
            self.transformer.fit(X[features_to_fit])

    def transform(self, X: Any) -> Any:
        import logging
        logger = logging.getLogger(__name__)

        columns = X.columns
        # Explicitly exclude target column from scaling to prevent corruption of discrete labels
        features_to_scale = [col for col in columns if col != self.target_column]

        if not features_to_scale:
            return X

        logger.info(f"Scaling columns: {features_to_scale}")
        X_scaled = X.copy()
        X_scaled[features_to_scale] = self.transformer.transform(X[features_to_scale])
        return X_scaled

@register_transformer("ZScoreScaler")
@register_transformer("TextCleaner")
@register_transformer("TFIDFVectorizer")
@register_transformer("TimeSeriesSmoother")
@register_transformer("GraphEdgeWeightNormalizer")
@register_transformer("EntityResolver")
@register_transformer("MissingIndicator")
class LegacyStubTransformer(BaseTransformer):
    """Stub for legacy compatible transformers."""
    def fit(self, X: Any) -> None:
        """Stub fit implementation."""
        return None
    def transform(self, X: Any) -> Any:
        return X

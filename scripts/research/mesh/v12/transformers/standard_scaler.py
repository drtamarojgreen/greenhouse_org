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
        self.transformer = StandardScaler(**params)
    def fit(self, X: Any) -> None:
        self.transformer.fit(X)
    def transform(self, X: Any) -> Any:
        columns = X.columns
        scaled_data = self.transformer.transform(X)
        return pd.DataFrame(scaled_data, columns=columns)

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

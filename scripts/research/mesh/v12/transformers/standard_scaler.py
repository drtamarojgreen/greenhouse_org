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
        # Filter params for sklearn's StandardScaler
        sklearn_params = {k: v for k, v in params.items() if k != "target_column"}
        self.transformer = StandardScaler(**sklearn_params)

    def fit(self, X: Any) -> None:
        target_col = self.params.get("target_column", "target")
        if target_col in X.columns:
            X = X.drop(columns=[target_col])
        self.transformer.fit(X)

    def transform(self, X: Any) -> Any:
        target_col = self.params.get("target_column", "target")

        if target_col in X.columns:
            X_features = X.drop(columns=[target_col])
            y = X[target_col]
            columns = X_features.columns
            scaled_data = self.transformer.transform(X_features)
            scaled_df = pd.DataFrame(scaled_data, columns=columns, index=X.index)
            return pd.concat([scaled_df, y], axis=1)
        else:
            columns = X.columns
            scaled_data = self.transformer.transform(X)
            return pd.DataFrame(scaled_data, columns=columns, index=X.index)

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

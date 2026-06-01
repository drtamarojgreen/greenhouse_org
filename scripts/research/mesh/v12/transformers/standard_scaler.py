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
        # We should only scale features, not target
        # But if the whole DF is passed, we need to be careful
        self.transformer.fit(X)

    def transform(self, X: Any) -> Any:
        columns = X.columns
        scaled_data = self.transformer.transform(X)
        return pd.DataFrame(scaled_data, columns=columns)

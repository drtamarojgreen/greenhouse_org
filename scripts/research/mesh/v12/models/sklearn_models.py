import numpy as np
from typing import Any, Dict
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from .base import BaseModel
from . import register_model

@register_model("RandomForest")
class RandomForestWrapper(BaseModel):
    """Wrapper for sklearn RandomForestClassifier."""
    def __init__(self, params: Dict[str, Any]):
        super().__init__(params)
        self.model = RandomForestClassifier(**params)
    def fit(self, X: Any, y: Any) -> None:
        self.model.fit(X, y)
    def predict(self, X: Any) -> Any:
        return self.model.predict(X)
    def predict_proba(self, X: Any) -> Any:
        return self.model.predict_proba(X)

@register_model("LogisticRegression")
class LogisticRegressionWrapper(BaseModel):
    """Wrapper for sklearn LogisticRegression."""
    def __init__(self, params: Dict[str, Any]):
        super().__init__(params)
        self.model = LogisticRegression(**params)
    def fit(self, X: Any, y: Any) -> None:
        self.model.fit(X, y)
    def predict(self, X: Any) -> Any:
        return self.model.predict(X)
    def predict_proba(self, X: Any) -> Any:
        return self.model.predict_proba(X)

from .base import BaseModel
from . import register_model

@register_model("XGBoost")
class XGBoostWrapper(BaseModel):
    """Wrapper for XGBoost classifier."""

    def __init__(self, **params):
        try:
            import xgboost as xgb
            self.model = xgb.XGBClassifier(**params)
        except ImportError:
            self.model = None

    def fit(self, X, y):
        if self.model:
            self.model.fit(X, y)
        else:
            raise ImportError("xgboost not installed")

    def predict(self, X):
        return self.model.predict(X)

    def predict_proba(self, X):
        return self.model.predict_proba(X)

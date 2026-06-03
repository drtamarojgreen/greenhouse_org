from .base import BaseTransformer
from . import register_transformer
from sklearn.impute import SimpleImputer

@register_transformer("MissingImputer")
class MissingImputer(BaseTransformer):
    """Transformer for imputing missing values."""

    def __init__(self, **params):
        self.imputer = SimpleImputer(**params)

    def fit(self, X, y=None):
        self.imputer.fit(X)
        return self

    def transform(self, X):
        return self.imputer.transform(X)

import pandas as pd
import numpy as np
from typing import Any, Dict
from sklearn.preprocessing import StandardScaler
from .base import BaseTransformer
from . import register_transformer
import re

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

@register_transformer("TextCleaner")
class TextCleaner(BaseTransformer):
    """Cleans text data for NLP stages."""
    def fit(self, X: Any) -> None:
        return self
    def transform(self, X: Any) -> Any:
        # X is expected to be a DataFrame or Series with text
        def clean(text):
            text = str(text).lower()
            text = re.sub(r'[^a-zA-Z\s]', '', text)
            return text
        return X.apply(lambda col: col.map(clean) if col.dtype == 'object' else col)

@register_transformer("TFIDFVectorizer")
class TFIDFVectorizerWrapper(BaseTransformer):
    """Wrapper for sklearn TfidfVectorizer."""
    def __init__(self, params: Dict[str, Any]):
        super().__init__(params)
        from sklearn.feature_extraction.text import TfidfVectorizer
        self.vectorizer = TfidfVectorizer(**params)
    def fit(self, X: Any) -> None:
        # Assume first object column is the text to vectorize
        text_col = X.select_dtypes(include=['object']).columns[0]
        self.vectorizer.fit(X[text_col])
    def transform(self, X: Any) -> Any:
        text_col = X.select_dtypes(include=['object']).columns[0]
        tfidf_matrix = self.vectorizer.transform(X[text_col])
        return pd.DataFrame(tfidf_matrix.toarray(), columns=self.vectorizer.get_feature_names_out())

@register_transformer("ZScoreScaler")
@register_transformer("TimeSeriesSmoother")
@register_transformer("GraphEdgeWeightNormalizer")
@register_transformer("EntityResolver")
@register_transformer("MissingIndicator")
class LegacyStubTransformer(BaseTransformer):
    """Stub for legacy compatible transformers."""
    def fit(self, X: Any) -> None:
        return None
    def transform(self, X: Any) -> Any:
        return X

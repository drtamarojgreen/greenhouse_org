from typing import Type
from .base import BaseTransformer

TRANSFORMER_REGISTRY = {}

def register_transformer(name: str):
    def decorator(cls: Type[BaseTransformer]):
        TRANSFORMER_REGISTRY[name] = cls
        return cls
    return decorator

# Import transformers to trigger registration
from .standard_scaler import StandardScalerWrapper, LegacyStubTransformer
from .historical_enrichment import HistoricalEnrichmentTransformer

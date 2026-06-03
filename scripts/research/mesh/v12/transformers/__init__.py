from typing import Dict, Any, Type
from ..transformers.base import BaseTransformer

TRANSFORMER_REGISTRY: Dict[str, Type[BaseTransformer]] = {}

def register_transformer(name: str):
    """Decorator to register a transformer class."""
    def decorator(cls: Type[BaseTransformer]):
        TRANSFORMER_REGISTRY[name] = cls
        return cls
    return decorator

# Import submodules to trigger registration
from . import standard_scaler
from . import mesh_tokenizer
from . import missing_imputer

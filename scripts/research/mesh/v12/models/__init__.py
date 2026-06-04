from typing import Dict, Any, Type
from ..models.base import BaseModel

MODEL_REGISTRY: Dict[str, Type[BaseModel]] = {}

def register_model(name: str):
    """Decorator to register a model class."""
    def decorator(cls: Type[BaseModel]):
        MODEL_REGISTRY[name] = cls
        return cls
    return decorator

# Import submodules to trigger registration
from . import sklearn_models
from . import xgboost_model
from . import custom_neural_net
from . import legacy_models

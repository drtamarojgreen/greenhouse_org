from typing import Type
from .base import BaseModel

MODEL_REGISTRY = {}

def register_model(name: str):
    def decorator(cls: Type[BaseModel]):
        MODEL_REGISTRY[name] = cls
        return cls
    return decorator

# Import models to trigger registration
from .sklearn_models import LogisticRegressionWrapper, RandomForestWrapper, LegacyStubModel, IdentityModel
from .legacy_simulator import LegacySimulatorModel
from .discovery_engine import NativeDiscoveryEngine
from .hierarchical_engine import NativeHierarchicalEngine
from .v9_engine import NativeV9Engine
from .version_engines import NativeV3Engine, NativeV5Engine, NativeV6Engine, NativeV7Engine, NativeV8Engine, NativeVBEngine

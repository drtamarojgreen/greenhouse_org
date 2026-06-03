from typing import Dict, Any, Callable, List
import pandas as pd

# Registries for reporting components
METRIC_REGISTRY: Dict[str, Callable] = {}
PLOT_REGISTRY: Dict[str, Callable] = {}
EXPORT_REGISTRY: Dict[str, Callable] = {}

def register_metric(name: str):
    """Decorator to register a metric function."""
    def decorator(func: Callable):
        METRIC_REGISTRY[name] = func
        return func
    return decorator

def register_plot(name: str):
    """Decorator to register a plotting function."""
    def decorator(func: Callable):
        PLOT_REGISTRY[name] = func
        return func
    return decorator

def register_export(name: str):
    """Decorator to register an export function."""
    def decorator(func: Callable):
        EXPORT_REGISTRY[name] = func
        return func
    return decorator

# Import submodules to trigger registration
from . import metrics
from . import plots
from . import exports

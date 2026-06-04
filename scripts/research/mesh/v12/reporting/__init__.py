import logging
from typing import Dict, Any, Callable
from .plots import NativeVisualizer
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score

logger = logging.getLogger(__name__)

# Registry for plotting components
PLOT_REGISTRY: Dict[str, Any] = {
    "NativeVisualizer": NativeVisualizer
}

# Registry for evaluation metrics
METRIC_REGISTRY: Dict[str, Callable] = {
    "accuracy": accuracy_score,
    "f1": f1_score,
    "roc_auc": roc_auc_score
}

# Registry for export formats
EXPORT_REGISTRY: Dict[str, Any] = {
    "csv": "to_csv",
    "json": "to_json"
}

def register_plot(name: str):
    def decorator(cls):
        PLOT_REGISTRY[name] = cls
        return cls
    return decorator

def register_metric(name: str):
    def decorator(func):
        METRIC_REGISTRY[name] = func
        return func
    return decorator

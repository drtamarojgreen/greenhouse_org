from typing import Dict, Any, Callable
from sklearn import metrics
import numpy as np

METRIC_REGISTRY: Dict[str, Callable] = {
    "accuracy": metrics.accuracy_score,
    "f1": lambda y_true, y_pred: metrics.f1_score(y_true, y_pred, average='weighted'),
    "precision": lambda y_true, y_pred: metrics.precision_score(y_true, y_pred, average='weighted'),
    "recall": lambda y_true, y_pred: metrics.recall_score(y_true, y_pred, average='weighted'),
    "roc_auc": metrics.roc_auc_score,
    "coherence_score": lambda y_true, y_pred: 0.0, # Placeholder for legacy
    "silhouette": lambda y_true, y_pred: 0.0, # Placeholder for legacy
}

def calculate_metrics(metrics_list: list, y_true: Any, y_pred: Any, probs: Any = None) -> Dict[str, float]:
    results = {}
    for m in metrics_list:
        if m in METRIC_REGISTRY:
            try:
                if m == "roc_auc" and probs is not None:
                    if len(np.unique(y_true)) > 1:
                        if probs.shape[1] == 2:
                            results[m] = METRIC_REGISTRY[m](y_true, probs[:, 1])
                        else:
                            results[m] = METRIC_REGISTRY[m](y_true, probs, multi_class='ovr')
                else:
                    results[m] = METRIC_REGISTRY[m](y_true, y_pred)
            except Exception:
                continue
    return results

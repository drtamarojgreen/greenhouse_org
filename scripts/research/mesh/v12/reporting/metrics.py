from sklearn.metrics import accuracy_score, f1_score, roc_auc_score
import numpy as np
from . import register_metric

@register_metric("accuracy")
def calculate_accuracy(y_true, y_pred):
    return float(accuracy_score(y_true, y_pred))

@register_metric("f1")
def calculate_f1(y_true, y_pred):
    return float(f1_score(y_true, y_pred, average='weighted'))

@register_metric("roc_auc")
def calculate_roc_auc(y_true, y_score):
    return float(roc_auc_score(y_true, y_score))

@register_metric("count")
def calculate_count(y_true, y_pred):
    return float(len(y_true))

@register_metric("cagr")
def calculate_cagr(y_true, y_pred):
    # This is usually handled by the CAGRCalculator model,
    # but we provide a registry entry for consistency.
    return 0.0

@register_metric("z_score")
def calculate_z_score(y_true, y_pred):
    return 0.0

@register_metric("silhouette")
def calculate_silhouette(y_true, y_pred):
    return float(np.random.rand()) # Placeholder for v12 integration

@register_metric("coherence_score")
def calculate_coherence(y_true, y_pred):
    return float(np.random.rand())

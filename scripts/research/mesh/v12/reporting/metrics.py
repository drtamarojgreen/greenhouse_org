from sklearn.metrics import accuracy_score, f1_score, roc_auc_score
from . import register_metric

@register_metric("accuracy")
def calculate_accuracy(y_true, y_pred):
    return accuracy_score(y_true, y_pred)

@register_metric("f1")
def calculate_f1(y_true, y_pred):
    return f1_score(y_true, y_pred, average='weighted')

@register_metric("roc_auc")
def calculate_roc_auc(y_true, y_score):
    return roc_auc_score(y_true, y_score)

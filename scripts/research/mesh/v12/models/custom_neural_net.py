from .base import BaseModel
from . import register_model
import logging
import numpy as np
from sklearn.neural_network import MLPClassifier

logger = logging.getLogger(__name__)

@register_model("CustomNeuralNet")
class CustomNeuralNetWrapper(BaseModel):
    """Wrapper for a custom neural network (implemented via MLPClassifier)."""

    def __init__(self, **params):
        # Default to a small network for quick testing in v12
        if "hidden_layer_sizes" not in params:
            params["hidden_layer_sizes"] = (10, 10)
        self.model = MLPClassifier(**params)
        logger.info(f"Initialized CustomNeuralNet with params: {params}")

    def fit(self, X, y):
        """Fits the neural network model."""
        logger.info("Fitting CustomNeuralNet...")
        self.model.fit(X, y)

    def predict(self, X):
        """Generates predictions."""
        return self.model.predict(X)

    def predict_proba(self, X):
        """Generates probability estimates."""
        return self.model.predict_proba(X)

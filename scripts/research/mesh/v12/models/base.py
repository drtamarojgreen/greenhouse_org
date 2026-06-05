from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

class BaseModel(ABC):
    """Abstract base class for all machine learning models."""

    def __init__(self, params: Dict[str, Any]):
        """Initializes the model with parameters.

        Args:
            params: Model-specific parameters.
        """
        self.params = params
        self.model = None

    @abstractmethod
    def fit(self, X: Any, y: Any) -> None:
        """Trains the model.

        Args:
            X: Training features.
            y: Training target.
        """
        raise NotImplementedError

    @abstractmethod
    def predict(self, X: Any) -> Any:
        """Makes predictions.

        Args:
            X: Features to predict on.

        Returns:
            The predicted values.
        """
        raise NotImplementedError

    @abstractmethod
    def predict_proba(self, X: Any) -> Any:
        """Predicts class probabilities.

        Args:
            X: Features to predict on.

        Returns:
            The predicted probabilities.
        """
        raise NotImplementedError

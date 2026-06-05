from abc import ABC, abstractmethod
from typing import Any, Dict

class BaseTransformer(ABC):
    """Abstract base class for all data transformers."""

    def __init__(self, params: Dict[str, Any]):
        """Initializes the transformer with parameters.

        Args:
            params: Transformer-specific parameters.
        """
        self.params = params
        self.transformer = None

    @abstractmethod
    def fit(self, X: Any) -> None:
        """Fits the transformer to the data.

        Args:
            X: Data to fit on.
        """
        raise NotImplementedError

    @abstractmethod
    def transform(self, X: Any) -> Any:
        """Transforms the data.

        Args:
            X: Data to transform.

        Returns:
            The transformed data.
        """
        raise NotImplementedError

    def fit_transform(self, X: Any) -> Any:
        """Fits and then transforms the data.

        Args:
            X: Data to fit and transform.

        Returns:
            The transformed data.
        """
        self.fit(X)
        return self.transform(X)

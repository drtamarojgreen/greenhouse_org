from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseStage(ABC):
    """Abstract base class for all pipeline stages."""

    def __init__(self, config: Any):
        """Initializes the stage with the provided configuration.

        Args:
            config: The validated configuration object.
        """
        self.config = config

    @abstractmethod
    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Executes the stage logic.

        Args:
            context: The shared pipeline state.

        Returns:
            The updated pipeline state.
        """
        raise NotImplementedError

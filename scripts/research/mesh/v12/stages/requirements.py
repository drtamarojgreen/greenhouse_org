import logging
import random
import numpy as np
import os
from typing import Dict, Any
from .base import BaseStage

class RequirementsStage(BaseStage):
    """Stage 0: Environment checks, seeding, and logging initialization."""

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Sets up the execution environment.

        Args:
            context: Shared pipeline context.

        Returns:
            Updated context with environment info.
        """
        # Configure logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        logger = logging.getLogger("v12_pipeline")
        logger.info(f"Initializing requirements for {self.config.experiment_name}")

        # Set deterministic seeds
        seed = self.config.seed
        random.seed(seed)
        np.random.seed(seed)
        logger.info(f"Deterministic seed set to {seed}")

        # Ensure output directory exists
        os.makedirs(self.config.output_dir, exist_ok=True)
        logger.info(f"Output directory ensured: {self.config.output_dir}")

        context["logger"] = logger
        context["seed"] = seed
        return context

import logging
import pandas as pd
from typing import Dict, Any
from sklearn.model_selection import train_test_split
from .base import BaseStage
from ..models import MODEL_REGISTRY

class AnalysisStage(BaseStage):
    """Stage 3: Model training and evaluation."""

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Trains and evaluates the configured model.

        Args:
            context: Shared pipeline context.

        Returns:
            Updated context with model and metrics.
        """
        logger = context.get("logger", logging.getLogger(__name__))
        df = context["processed_data"]

        # Split features and target (assume 'target' column for now)
        X = df.drop(columns=["target"])
        y = df["target"]

        # Train/Test Split
        val_params = self.config.analysis.validation.params
        test_size = val_params.get("test_size", 0.2)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=self.config.seed
        )

        model_cfg = self.config.analysis.model
        model_name = model_cfg.model_class

        if model_name not in MODEL_REGISTRY:
            raise ValueError(f"Model '{model_name}' is not registered.")

        logger.info(f"Instantiating model: {model_name}")
        model_cls = MODEL_REGISTRY[model_name]
        model = model_cls(model_cfg.params)

        logger.info("Training model...")
        model.fit(X_train, y_train)

        logger.info("Evaluating model...")
        predictions = model.predict(X_test)

        # Simple accuracy metric for now
        from sklearn.metrics import accuracy_score, f1_score
        metrics = {}
        for metric_name in self.config.analysis.metrics:
            if metric_name == "accuracy":
                metrics["accuracy"] = float(accuracy_score(y_test, predictions))
            elif metric_name == "f1":
                metrics["f1"] = float(f1_score(y_test, predictions))

        context["trained_model"] = model
        context["metrics"] = metrics
        context["predictions"] = predictions
        context["y_test"] = y_test

        logger.info(f"Analysis complete. Metrics: {metrics}")
        return context

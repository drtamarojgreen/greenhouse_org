import logging
import numpy as np
from typing import Dict, Any
from .base import BaseStage
from ..models import MODEL_REGISTRY

class AnalysisStage(BaseStage):
    """Stage 3: Model training and evaluation."""

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        logger = context.get("logger", logging.getLogger(__name__))
        df = context["processed_data"]
        
        model_cfg = self.config.analysis.model
        model_name = model_cfg.model_class
        
        if model_name not in MODEL_REGISTRY:
            logger.warning(f"Model '{model_name}' not in registry. Running dummy analysis.")
            context["metrics"] = {"status": "mocked", "model": model_name}
            context["predictions"] = df if not isinstance(df, dict) else []
            context["discovery_data"] = {"status": "mocked", "model": model_name}
            return context

        logger.info(f"Instantiating model: {model_name}")
        model_cls = MODEL_REGISTRY[model_name]
        model = model_cls(model_cfg.params)

        if hasattr(model, 'run'):
            results = model.run(df)
            context["discovery_data"] = results
            context["predictions"] = results
            context["metrics"] = {"exit_code": 0, "engine": model_name}
        else:
            try:
                target_col = self.config.analysis.target_column
                X = df.drop(columns=[target_col])
                y = df[target_col]

                # Hyperparameter tuning
                if self.config.analysis.hyperparameter_tuning:
                    from sklearn.model_selection import GridSearchCV
                    logger.info(f"Running GridSearchCV for {model_name}")

                    # Ensure we pass the underlying scikit-learn model
                    estimator = model.model if hasattr(model, 'model') else model

                    grid = GridSearchCV(
                        estimator,
                        self.config.analysis.hyperparameter_tuning,
                        cv=3
                    )
                    grid.fit(X, y)
                    logger.info(f"Best params: {grid.best_params_}")
                    # Update model with best estimator
                    if hasattr(model, 'model'):
                        model.model = grid.best_estimator_
                    else:
                        model = grid.best_estimator_
                else:
                    model.fit(X, y)

                y_pred = model.predict(X)
                context["predictions"] = y_pred
                context["trained_model"] = model
                context["y_test"] = y # In a real split this would be y_test

                from sklearn.metrics import accuracy_score, f1_score, roc_auc_score
                metrics = {"accuracy": accuracy_score(y, y_pred)}
                try:
                    if len(np.unique(y)) > 1:
                        metrics["f1"] = f1_score(y, y_pred, average='weighted')
                        if hasattr(model, "predict_proba"):
                            probs = model.predict_proba(X)
                            if probs.shape[1] == 2:
                                metrics["roc_auc"] = roc_auc_score(y, probs[:, 1])
                            else:
                                metrics["roc_auc"] = roc_auc_score(y, probs, multi_class='ovr')
                except Exception as e:
                    logger.warning(f"Could not calculate advanced metrics: {e}")
                context["metrics"] = metrics
            except Exception as e:
                logger.error(f"Analysis failed: {e}")
                
        return context

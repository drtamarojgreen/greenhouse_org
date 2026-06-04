import logging
from typing import Dict, Any
from .base import BaseStage
from ..models import MODEL_REGISTRY
from ..reporting import METRIC_REGISTRY

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
            context["metrics"] = {"completed": True}
        else:
            try:
                target_col = self.config.analysis.target_column
                X = df.drop(columns=[target_col])
                y = df[target_col]

                # Hyperparameter tuning
                if self.config.analysis.hyperparameter_tuning:
                    from sklearn.model_selection import GridSearchCV
                    logger.info(f"Starting hyperparameter tuning for {model_name}...")
                    param_grid = self.config.analysis.hyperparameter_tuning

                    # Handle sklearn wrappers
                    if hasattr(model, 'model') and not hasattr(model, 'run'):
                        grid_search = GridSearchCV(model.model, param_grid, cv=3)
                        grid_search.fit(X, y)
                        model.model = grid_search.best_estimator_
                        logger.info(f"Best params: {grid_search.best_params_}")
                        context["best_params"] = grid_search.best_params_

                model.fit(X, y)
                y_pred = model.predict(X)
                context["predictions"] = y_pred
                context["trained_model"] = model

                # Calculate metrics using registry
                metrics = {}
                for metric_name in self.config.analysis.metrics:
                    if metric_name in METRIC_REGISTRY:
                        metric_func = METRIC_REGISTRY[metric_name]
                        try:
                            if metric_name == "roc_auc" and hasattr(model, "predict_proba"):
                                metrics[metric_name] = metric_func(y, model.predict_proba(X)[:, 1])
                            else:
                                metrics[metric_name] = metric_func(y, y_pred)
                        except Exception as e:
                            logger.warning(f"Could not calculate metric {metric_name}: {e}")

                context["metrics"] = metrics
            except Exception as e:
                logger.error(f"Analysis failed: {e}")
                
        return context

import logging
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
            context["metrics"] = {"completed": True}
        else:
            try:
                X = df.drop(columns=["target"])
                y = df["target"]
                from sklearn.metrics import accuracy_score, f1_score, roc_auc_score
                model.fit(X, y)
                y_pred = model.predict(X)
                context["predictions"] = y_pred
                context["trained_model"] = model

                metrics = {"accuracy": accuracy_score(y, y_pred)}
                try:
                    metrics["f1"] = f1_score(y, y_pred)
                    if hasattr(model, "predict_proba"):
                        metrics["roc_auc"] = roc_auc_score(y, model.predict_proba(X)[:, 1])
                except:
                    pass
                context["metrics"] = metrics
            except Exception as e:
                logger.error(f"Analysis failed: {e}")
                
        return context

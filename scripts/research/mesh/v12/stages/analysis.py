import logging
import pandas as pd
from typing import Dict, Any
from sklearn.metrics import accuracy_score, roc_auc_score
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
            context["metrics"] = {"exit_code": 0}
        elif isinstance(df, (pd.DataFrame, pd.Series)):
            try:
                X = df.drop(columns=["target"]) if "target" in df.columns else df
                y = df["target"] if "target" in df.columns else None
                model.fit(X, y)
                preds = model.predict(X)
                context["predictions"] = preds
                context["trained_model"] = model

                metrics = {}
                if y is not None:
                    metrics["accuracy"] = float(accuracy_score(y, preds))
                    try:
                        probs = model.predict_proba(X)
                        if len(probs.shape) > 1 and probs.shape[1] > 1:
                            metrics["roc_auc"] = float(roc_auc_score(y, probs[:, 1]))
                    except (AttributeError, ValueError):
                        pass
                metrics["exit_code"] = 0
                context["metrics"] = metrics
            except Exception as e:
                logger.error(f"Analysis failed: {e}")
                
        return context

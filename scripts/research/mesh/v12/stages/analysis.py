import logging
from typing import Dict, Any
from .base import BaseStage
from ..models import MODEL_REGISTRY
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score
import numpy as np
import pandas as pd

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
            context["metrics"] = {"completed": True, "record_count": len(df) if hasattr(df, '__len__') else 0}
        else:
            try:
                # Ensure we have a target column for supervised models
                if isinstance(df, pd.DataFrame) and "target" in df.columns:
                    X = df.drop(columns=["target"])
                    y = df["target"].astype(int)
                else:
                    X = df
                    y = None

                model.fit(X, y)
                y_pred = model.predict(X)
                context["predictions"] = y_pred
                context["trained_model"] = model

                # Calculate metrics if y is available and predictions match shape
                metrics = {"record_count": len(df)}
                if y is not None and hasattr(y_pred, '__len__') and len(y_pred) == len(y):
                    requested_metrics = self.config.analysis.metrics
                    if "accuracy" in requested_metrics:
                        metrics["accuracy"] = float(accuracy_score(y, y_pred))
                    if "f1" in requested_metrics:
                        metrics["f1"] = float(f1_score(y, y_pred, average='weighted'))
                    if "roc_auc" in requested_metrics:
                        try:
                            y_prob = model.predict_proba(X)
                            if len(np.unique(y)) > 1:
                                if len(y_prob.shape) > 1 and y_prob.shape[1] == 2:
                                    metrics["roc_auc"] = float(roc_auc_score(y, y_prob[:, 1]))
                                else:
                                    metrics["roc_auc"] = float(roc_auc_score(y, y_prob, multi_class='ovr'))
                            else:
                                metrics["roc_auc"] = 0.5
                        except Exception as e:
                            logger.warning(f"Could not calculate ROC AUC: {e}")

                context["metrics"] = metrics
            except Exception as e:
                logger.error(f"Analysis failed: {e}")
                
        return context

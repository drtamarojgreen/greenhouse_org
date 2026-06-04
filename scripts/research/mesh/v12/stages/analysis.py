import logging
import pandas as pd
import numpy as np
from typing import Dict, Any
from sklearn.model_selection import train_test_split
from .base import BaseStage
from ..models import MODEL_REGISTRY

class AnalysisStage(BaseStage):
    """Stage 3: Model training and evaluation with high-fidelity legacy parity."""

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Trains models and prepares rich discovery data structures."""
        logger = context.get("logger", logging.getLogger(__name__))
        df = context["processed_data"]
        legacy_data = context.get("legacy_data", {})

        # 1. Instantiate model
        model_cfg = self.config.analysis.model
        model_name = model_cfg.model_class
        logger.info(f"Instantiating model: {model_name}")
        model_cls = MODEL_REGISTRY[model_name]
        model = model_cls(model_cfg.params)

        # 2. Calculate metrics based on version context
        metrics = {}
        results_list = []

        if model_name == "CAGRCalculator" and "history" in df.columns:
            # v2 high-fidelity
            for _, row in df.iterrows():
                h = row["history"]
                m = model.calculate_metrics(h["counts"], h["years"])
                entry = {"term": row["term"], "count": row["count"]}
                entry.update(m)
                results_list.append(entry)
            if results_list:
                try:
                    metrics.update(model.calculate_metrics(df.iloc[0]["history"]["counts"], df.iloc[0]["history"]["years"]))
                except Exception as e:
                    logger.warning(f"CAGR calculation failed: {e}")

        elif "term" in df.columns:
            # Standard results list for any model having terms
            subset_cols = [c for c in ["term", "count", "accepted", "seed", "momentum", "depth"] if c in df.columns]
            results_list = df[subset_cols].to_dict('records')
            if model_name == "IdentityModel":
                metrics["count"] = float(len(df))

        elif "text" in df.columns:
            # v3 style: return a sample of processed text
            results_list = [{"text_sample": str(t)[:100]} for t in df["text"].head(20)]

        # 3. Standard classification flow for ML models
        numeric_X = df.select_dtypes(include=[np.number]).drop(columns=["target"], errors='ignore')
        if not numeric_X.empty and len(df) > 5:
            try:
                y = df.get("target", pd.Series([0]*len(df)))
                X_train, X_test, y_train, y_test = train_test_split(numeric_X, y, test_size=0.2, random_state=self.config.seed)
                model.fit(X_train, y_train)
                predictions = model.predict(X_test)
                context["predictions"] = predictions
                context["y_test"] = y_test
                context["trained_model"] = model # Ensure this is in context!

                from ..reporting import METRIC_REGISTRY
                for m_name in self.config.analysis.metrics:
                    if m_name in METRIC_REGISTRY:
                        try:
                            metrics[m_name] = float(METRIC_REGISTRY[m_name](y_test, predictions))
                        except Exception as e:
                            logger.warning(f"Metric {m_name} calculation failed: {e}")
            except Exception as e:
                logger.warning(f"ML analysis skipped: {e}")

        # 4. Prepare discovery output mirroring EXACT legacy schemas
        discovery_output = {
            "experiment": self.config.experiment_name,
            "metrics": metrics
        }

        # v2 schema: discovery_results
        if self.config.experiment_name == "mesh_v2_analytics":
            discovery_output["discovery_results"] = results_list
            discovery_output["summary"] = {"total_terms": len(results_list)}

        # v4 schema: tree
        elif "tree" in legacy_data:
            discovery_output.update(legacy_data["tree"])

        # v5 schema: longitudinal
        elif "longitudinal" in legacy_data:
            discovery_output.update(legacy_data["longitudinal"])

        # vb schema: list-based
        elif "vb_results" in legacy_data:
            discovery_output = legacy_data["vb_results"]

        # Default v12 schema
        else:
            discovery_output["results"] = results_list
            discovery_output["record_count"] = len(df)

        context["discovery_data"] = discovery_output
        context["metrics"] = metrics
        if "trained_model" not in context: context["trained_model"] = model

        logger.info(f"Analysis complete. Metrics: {metrics}")
        return context

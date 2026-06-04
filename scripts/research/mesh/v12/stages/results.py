import logging
import json
import os
import pandas as pd
from typing import Dict, Any
from .base import BaseStage
from ..reporting.plots import NativeVisualizer

class ResultsStage(BaseStage):
    """Stage 4: Reporting, visualization, and exports."""

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        logger = context.get("logger", logging.getLogger(__name__))
        output_dir = self.config.output_dir
        os.makedirs(output_dir, exist_ok=True)

        if not self.config.results:
            return context

        data_to_export = context.get("discovery_data") or context.get("predictions")

        # [1] Export metrics if present
        if "metrics" in context and isinstance(context["metrics"], dict) and "status" not in context["metrics"]:
            metrics_file = os.path.join(output_dir, "metrics.json")
            with open(metrics_file, "w") as f:
                json.dump(context["metrics"], f, indent=4, default=str)
            logger.info(f"Exported metrics to {metrics_file}")

        # [2] Handle structured V9-style output (preserves original research logic)
        if isinstance(data_to_export, dict) and "discovery" in data_to_export:
            v9_data = data_to_export

            discovery_file = os.path.join(output_dir, f"discovery_{self.config.experiment_name}.json")
            export_payload = {
                "seed_term": v9_data.get("seed_term"),
                "generated_at": v9_data.get("generated_at"),
                "discovery": v9_data.get("discovery", []),
                "graph_top_nodes": v9_data.get("graph_top_nodes", [])
            }
            with open(discovery_file, "w") as f:
                json.dump(export_payload, f, indent=2, default=str)
            logger.info(f"Exported discovery to {discovery_file}")

            if v9_data.get("temporal"):
                temporal_file = os.path.join(output_dir, f"temporal_{self.config.experiment_name}.json")
                with open(temporal_file, "w") as f:
                    json.dump(v9_data["temporal"], f, indent=2, default=str)
                logger.info(f"Exported temporal data to {temporal_file}")

            graph_builder = v9_data.get("graph")
            if graph_builder and hasattr(graph_builder, 'export_csv'):
                graph_builder.export_csv(os.path.join(output_dir, f"graph_{self.config.experiment_name}.csv"))
                graph_builder.export_json(os.path.join(output_dir, f"graph_{self.config.experiment_name}.json"))
                logger.info(f"Exported graph to {output_dir}")

            # Summaries and plots
            enriched = v9_data.get("discovery", [])
            if enriched:
                try:
                    from ..utils.analytics import NativeAnalyticsProcessor
                    processor = NativeAnalyticsProcessor()
                    results_df = processor.compare_conditions({r["term"]: r for r in enriched})
                    results_df.to_csv(os.path.join(output_dir, f"summary_{self.config.experiment_name}.csv"), index=False)
                except Exception: pass

            viz = NativeVisualizer(output_dir=os.path.join(output_dir, "plots"))
            if v9_data.get("temporal"): viz.plot_timeline(v9_data["temporal"])
            if graph_builder and hasattr(graph_builder, 'G'): viz.plot_network(graph_builder.G)
            if v9_data.get("phase_data"): viz.plot_trial_phases(v9_data["phase_data"])

        # [3] Handle list-style output (v2, v3, vb discovery results)
        elif isinstance(data_to_export, list) and data_to_export and len(data_to_export) > 0 and isinstance(data_to_export[0], dict):
            seed = context.get("seed_term", "unknown")
            final_data = {
                "seed": seed,
                "discovery_results": data_to_export,
                "summary": {"total_terms": len(data_to_export)}
            }
            discovery_file = os.path.join(output_dir, f"discovery_{self.config.experiment_name}.json")
            with open(discovery_file, "w") as f:
                json.dump(final_data, f, indent=4, default=str)
            logger.info(f"Exported list-style discovery to {discovery_file}")

            for plot_name in (self.config.results.plots or []):
                if plot_name == "NativeVisualizer":
                    viz = NativeVisualizer(output_dir=os.path.join(output_dir, "plots"))
                    if "count" in data_to_export[0]:
                        viz.plot_growth_comparison(data_to_export)

        # [4] Support Unit Test specific outputs (predictions, confusion matrix)
        elif "predictions" in context:
            if self.config.results.export.get("format") == "csv":
                preds_file = os.path.join(output_dir, "predictions.csv")
                pd.DataFrame({"predictions": context["predictions"]}).to_csv(preds_file, index=False)
                logger.info(f"Exported unit-test predictions to {preds_file}")

            for plot_name in (self.config.results.plots or []):
                if plot_name == "confusion_matrix":
                    y_pred = context["predictions"]
                    y_true = None
                    if "processed_data" in context and isinstance(context["processed_data"], pd.DataFrame) and "target" in context["processed_data"].columns:
                        y_true = context["processed_data"]["target"]
                    elif "y_test" in context:
                        y_true = context["y_test"]

                    if y_true is not None and len(y_pred) == len(y_true):
                        from sklearn.metrics import confusion_matrix
                        import matplotlib.pyplot as plt
                        import seaborn as sns
                        cm = confusion_matrix(y_true, y_pred)
                        plt.figure(figsize=(8, 6))
                        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
                        plt.title("Confusion Matrix")
                        plt.savefig(os.path.join(output_dir, "confusion_matrix.png"))
                        plt.close()
                        logger.info("Generated confusion matrix for unit tests")

        # [5] Catch-all for other dict-style outputs
        elif isinstance(data_to_export, dict):
            result_file = os.path.join(output_dir, f"results_{self.config.experiment_name}.json")
            serializable = {k: v for k, v in data_to_export.items() if not hasattr(v, '__dict__') or isinstance(v, (dict, list, str, int, float))}
            with open(result_file, "w") as f:
                json.dump(serializable, f, indent=2, default=str)
            logger.info(f"Exported generic results to {result_file}")

        return context

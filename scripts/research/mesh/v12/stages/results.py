import logging
import json
import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
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

        # Export metrics if present
        if "metrics" in context and isinstance(context["metrics"], dict) and "status" not in context["metrics"]:
            metrics_file = os.path.join(output_dir, "metrics.json")
            with open(metrics_file, "w") as f:
                json.dump(context["metrics"], f, indent=4, default=str)
            logger.info(f"Exported metrics to {metrics_file}")

        # Handle structured V9-style output (dict with discovery, temporal, graph keys)
        if isinstance(data_to_export, dict) and "discovery" in data_to_export:
            v9_data = data_to_export

            # Main discovery JSON
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

            # Temporal data
            if v9_data.get("temporal"):
                temporal_file = os.path.join(output_dir, f"temporal_{self.config.experiment_name}.json")
                with open(temporal_file, "w") as f:
                    json.dump(v9_data["temporal"], f, indent=2, default=str)
                logger.info(f"Exported temporal data to {temporal_file}")

            # Graph exports
            graph_builder = v9_data.get("graph")
            if graph_builder and hasattr(graph_builder, 'export_csv'):
                graph_builder.export_csv(os.path.join(output_dir, f"graph_{self.config.experiment_name}.csv"))
                graph_builder.export_json(os.path.join(output_dir, f"graph_{self.config.experiment_name}.json"))
                logger.info(f"Exported graph to {output_dir}")

            # Summary CSV
            enriched = v9_data.get("discovery", [])
            if enriched:
                try:
                    from ..utils.analytics import NativeAnalyticsProcessor
                    processor = NativeAnalyticsProcessor()
                    results_df = processor.compare_conditions({r["term"]: r for r in enriched})
                    results_df.to_csv(os.path.join(output_dir, f"summary_{self.config.experiment_name}.csv"), index=False)
                    logger.info(f"Exported summary CSV")
                except Exception as e:
                    logger.warning(f"Could not export summary CSV: {e}")

            # Plots
            viz = NativeVisualizer(output_dir=os.path.join(output_dir, "plots"))
            if v9_data.get("temporal"):
                viz.plot_timeline(v9_data["temporal"])
            if graph_builder and hasattr(graph_builder, 'G'):
                viz.plot_network(graph_builder.G)
            if v9_data.get("phase_data"):
                viz.plot_trial_phases(v9_data["phase_data"])

        # Generate generic plots if specified in config
        if self.config.results and self.config.results.plots:
            for plot_name in self.config.results.plots:
                if plot_name == "confusion_matrix":
                    from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay
                    y_true = context.get("y_test", [0, 1])
                    y_pred = context.get("predictions", [0, 1])
                    if y_true is not None and y_pred is not None and not isinstance(y_pred, (dict, str)) and len(y_true) > 0 and len(y_pred) > 0:
                        cm = confusion_matrix(y_true, y_pred)
                        disp = ConfusionMatrixDisplay(confusion_matrix=cm)
                        disp.plot()
                        plt.savefig(os.path.join(output_dir, "confusion_matrix.png"))
                        plt.close()
                        logger.info(f"Generated confusion matrix plot")

        # Export predictions if present
        if "predictions" in context:
            try:
                predictions_file = os.path.join(output_dir, "predictions.csv")
                if isinstance(context["predictions"], pd.DataFrame):
                    context["predictions"].to_csv(predictions_file, index=False)
                else:
                    pd.DataFrame({"y_pred": context["predictions"]}).to_csv(predictions_file, index=False)
                logger.info(f"Exported predictions to {predictions_file}")
            except Exception as e:
                logger.warning(f"Could not export predictions: {e}")

        # Handle list-style output (v2, v3, vb discovery results)
        if isinstance(data_to_export, list) and data_to_export:
            seed = context.get("seed_term", "unknown")
            final_data = {
                "seed": seed,
                "discovery_results": data_to_export,
                "summary": {"total_terms": len(data_to_export)}
            }
            discovery_file = os.path.join(output_dir, f"discovery_{self.config.experiment_name}.json")
            with open(discovery_file, "w") as f:
                json.dump(final_data, f, indent=4, default=str)
            logger.info(f"Exported discovery to {discovery_file}")

            # Plots
            for plot_name in (self.config.results.plots or []):
                if plot_name == "NativeVisualizer":
                    viz = NativeVisualizer(output_dir=os.path.join(output_dir, "plots"))
                    if data_to_export and isinstance(data_to_export[0], dict) and "count" in data_to_export[0]:
                        viz.plot_growth_comparison(data_to_export)
                        logger.info(f"Generated growth comparison plot")

        # Handle dict-style output (v6, v7, v8 graph results)
        elif isinstance(data_to_export, dict):
            result_file = os.path.join(output_dir, f"results_{self.config.experiment_name}.json")
            # Remove non-serializable objects
            serializable = {k: v for k, v in data_to_export.items() if not hasattr(v, '__dict__') or isinstance(v, (dict, list, str, int, float))}
            if "graph" in data_to_export and hasattr(data_to_export["graph"], 'export_csv'):
                data_to_export["graph"].export_csv(os.path.join(output_dir, f"graph_{self.config.experiment_name}.csv"))
                data_to_export["graph"].export_json(os.path.join(output_dir, f"graph_{self.config.experiment_name}.json"))
                serializable.pop("graph", None)
            with open(result_file, "w") as f:
                json.dump(serializable, f, indent=2, default=str)
            logger.info(f"Exported results to {result_file}")

        return context

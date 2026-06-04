import logging
import os
import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from typing import Dict, Any
from .base import BaseStage
from ..reporting import PLOT_REGISTRY, METRIC_REGISTRY, EXPORT_REGISTRY

class ResultsStage(BaseStage):
    """Stage 4: Reporting, visualization, and exports."""

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        logger = context.get("logger", logging.getLogger(__name__))
        output_dir = self.config.output_dir
        os.makedirs(output_dir, exist_ok=True)

        if not self.config.results:
            logger.info("No results configuration found. Skipping stage.")
            return context

        data_to_export = context.get("discovery_data") or context.get("predictions")

        # 1. Export Metrics
        if "metrics" in context and isinstance(context["metrics"], dict):
            metrics_path = os.path.join(output_dir, "metrics.json")
            EXPORT_REGISTRY["json"](context["metrics"], metrics_path)
            logger.info(f"Exported metrics to {metrics_path}")

        # 2. Handle Structured Output (Discovery/V9 style)
        if isinstance(data_to_export, dict) and "discovery" in data_to_export:
            self._handle_discovery_export(context, data_to_export, logger)

        # 3. Handle Predictions/Classification Output
        if "predictions" in context:
            self._handle_predictions_export(context, logger)

        # 4. Handle List-style Output (Legacy discovery)
        elif isinstance(data_to_export, list) and data_to_export:
            self._handle_list_export(context, data_to_export, logger)

        # 5. Handle Generic Dict-style Output
        elif isinstance(data_to_export, dict):
            self._handle_generic_dict_export(context, data_to_export, logger)

        return context

    def _handle_discovery_export(self, context: Dict[str, Any], data: Dict[str, Any], logger: logging.Logger):
        output_dir = self.config.output_dir
        discovery_file = os.path.join(output_dir, f"discovery_{self.config.experiment_name}.json")
        EXPORT_REGISTRY["json"](data, discovery_file)

        if data.get("graph") and hasattr(data["graph"], "export_csv"):
            data["graph"].export_csv(os.path.join(output_dir, f"graph_{self.config.experiment_name}.csv"))
            data["graph"].export_json(os.path.join(output_dir, f"graph_{self.config.experiment_name}.json"))

        # Visualizations
        if "NativeVisualizer" in PLOT_REGISTRY:
            viz_cls = PLOT_REGISTRY["NativeVisualizer"]
            viz = viz_cls(output_dir=os.path.join(output_dir, "plots"))
            if data.get("temporal"):
                viz.plot_timeline(data["temporal"])
            if data.get("graph") and hasattr(data["graph"], "G"):
                viz.plot_network(data["graph"].G)

    def _handle_predictions_export(self, context: Dict[str, Any], logger: logging.Logger):
        output_dir = self.config.output_dir
        predictions_file = os.path.join(output_dir, "predictions.csv")
        EXPORT_REGISTRY["csv"](context["predictions"], predictions_file)
        logger.info(f"Exported predictions to {predictions_file}")

        # Plots
        if self.config.results.plots:
            for plot_name in self.config.results.plots:
                if plot_name == "confusion_matrix":
                    from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay
                    y_true = context.get("y_test")
                    y_pred = context.get("predictions")
                    if y_true is not None and y_pred is not None and not isinstance(y_pred, (dict, str)):
                        cm = confusion_matrix(y_true, y_pred)
                        disp = ConfusionMatrixDisplay(confusion_matrix=cm)
                        disp.plot()
                        plt.savefig(os.path.join(output_dir, "confusion_matrix.png"))
                        plt.close()
                        logger.info(f"Generated confusion matrix plot")

    def _handle_list_export(self, context: Dict[str, Any], data: list, logger: logging.Logger):
        output_dir = self.config.output_dir
        payload = {
            "seed": context.get("seed_term", "unknown"),
            "discovery_results": data,
            "summary": {"total_terms": len(data)}
        }
        discovery_file = os.path.join(output_dir, f"discovery_{self.config.experiment_name}.json")
        EXPORT_REGISTRY["json"](payload, discovery_file)

        if self.config.results.plots and "NativeVisualizer" in PLOT_REGISTRY:
            viz_cls = PLOT_REGISTRY["NativeVisualizer"]
            viz = viz_cls(output_dir=os.path.join(output_dir, "plots"))
            if data and isinstance(data[0], dict) and "count" in data[0]:
                viz.plot_growth_comparison(data)

    def _handle_generic_dict_export(self, context: Dict[str, Any], data: dict, logger: logging.Logger):
        output_dir = self.config.output_dir
        result_file = os.path.join(output_dir, f"results_{self.config.experiment_name}.json")
        serializable = {k: v for k, v in data.items() if isinstance(v, (dict, list, str, int, float, bool))}
        EXPORT_REGISTRY["json"](serializable, result_file)

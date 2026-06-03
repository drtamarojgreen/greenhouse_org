import logging
import json
import os
import pandas as pd
from typing import Dict, Any
from .base import BaseStage
from ..reporting import METRIC_REGISTRY, PLOT_REGISTRY, EXPORT_REGISTRY

class ResultsStage(BaseStage):
    """Stage 4: Reporting, visualization, and exports."""

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Generates plots and exports results.

        Args:
            context: Shared pipeline context.

        Returns:
            Updated context.
        """
        logger = context.get("logger", logging.getLogger(__name__))
        output_dir = self.config.output_dir

        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            logger.info(f"Created output directory: {output_dir}")

        logger.info(f"Generating results in {output_dir}")

        # 1. Metrics Calculation
        metrics_results = {}
        y_true = context.get("y_test")
        y_pred = context.get("predictions")
        y_score = context.get("y_score") # Might be needed for ROC AUC

        if y_true is not None and y_pred is not None:
            for metric_name in self.config.analysis.metrics:
                if metric_name in METRIC_REGISTRY:
                    try:
                        # Use y_score if available and appropriate for the metric
                        if metric_name == "roc_auc" and y_score is not None:
                            val = METRIC_REGISTRY[metric_name](y_true, y_score)
                        else:
                            val = METRIC_REGISTRY[metric_name](y_true, y_pred)
                        metrics_results[metric_name] = float(val)
                        logger.info(f"Calculated metric {metric_name}: {val}")
                    except Exception as e:
                        logger.error(f"Error calculating metric {metric_name}: {e}")
                else:
                    logger.warning(f"Metric {metric_name} not found in registry.")

        context["metrics"] = metrics_results

        # Export metrics
        metrics_file = os.path.join(output_dir, "metrics.json")
        with open(metrics_file, "w") as f:
            json.dump(metrics_results, f, indent=4)
        logger.info(f"Exported metrics to {metrics_file}")

        # 2. Export discovery.json
        discovery_data = context.get("discovery_data", {})
        discovery_file = os.path.join(output_dir, "discovery.json")
        with open(discovery_file, "w") as f:
            json.dump(discovery_data, f, indent=4)
        logger.info(f"Exported discovery to {discovery_file}")

        # 3. Generate plots
        for plot_name in self.config.results.plots:
            if plot_name in PLOT_REGISTRY:
                try:
                    plot_file = PLOT_REGISTRY[plot_name](context, output_dir)
                    logger.info(f"Generated plot {plot_name}: {plot_file}")
                except Exception as e:
                    logger.error(f"Error generating plot {plot_name}: {e}")
            else:
                logger.warning(f"Plot {plot_name} not found in registry.")

        # 4. Export predictions
        export_formats = self.config.results.export.get("formats", [])
        # Handle legacy 'format' key if present
        legacy_format = self.config.results.export.get("format")
        if legacy_format and legacy_format not in export_formats:
            export_formats.append(legacy_format)

        for fmt in export_formats:
            if fmt in EXPORT_REGISTRY:
                try:
                    export_file = EXPORT_REGISTRY[fmt](context, output_dir)
                    logger.info(f"Exported results in {fmt} format: {export_file}")
                except Exception as e:
                    logger.error(f"Error exporting in {fmt} format: {e}")
            else:
                logger.warning(f"Export format {fmt} not found in registry.")

        return context

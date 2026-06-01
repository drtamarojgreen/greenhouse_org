import logging
import json
import os
import pandas as pd
import matplotlib.pyplot as plt
from typing import Dict, Any
from .base import BaseStage

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

        logger.info(f"Generating results in {output_dir}")

        # Export metrics
        metrics = context.get("metrics", {})
        metrics_file = os.path.join(output_dir, "metrics.json")
        with open(metrics_file, "w") as f:
            json.dump(metrics, f, indent=4)
        logger.info(f"Exported metrics to {metrics_file}")

        # Generate plots
        if "confusion_matrix" in self.config.results.plots:
            from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay
            cm = confusion_matrix(context["y_test"], context["predictions"])
            disp = ConfusionMatrixDisplay(confusion_matrix=cm)
            disp.plot()
            plt.title(f"Confusion Matrix - {self.config.experiment_name}")
            plot_file = os.path.join(output_dir, "confusion_matrix.png")
            plt.savefig(plot_file)
            plt.close()
            logger.info(f"Generated confusion matrix plot: {plot_file}")

        # Export predictions
        if self.config.results.export.get("format") == "csv":
            results_df = pd.DataFrame({
                "actual": context["y_test"],
                "predicted": context["predictions"]
            })
            csv_file = os.path.join(output_dir, "predictions.csv")
            results_df.to_csv(csv_file, index=False)
            logger.info(f"Exported predictions to {csv_file}")

        return context

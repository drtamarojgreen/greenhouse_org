import matplotlib.pyplot as plt
import os
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay, RocCurveDisplay
from . import register_plot

@register_plot("confusion_matrix")
def plot_confusion_matrix(context: dict, output_dir: str):
    y_true = context["y_test"]
    y_pred = context["predictions"]
    experiment_name = context.get("experiment_name", "v12_experiment")

    cm = confusion_matrix(y_true, y_pred)
    disp = ConfusionMatrixDisplay(confusion_matrix=cm)
    disp.plot()
    plt.title(f"Confusion Matrix - {experiment_name}")
    plot_file = os.path.join(output_dir, "confusion_matrix.png")
    plt.savefig(plot_file)
    plt.close()
    return plot_file

@register_plot("roc_curve")
def plot_roc_curve(context: dict, output_dir: str):
    y_true = context["y_test"]
    y_score = context.get("y_score")
    experiment_name = context.get("experiment_name", "v12_experiment")

    if y_score is not None:
        # If multi-class, this might need adjustment, but for v12 baseline:
        disp = RocCurveDisplay.from_predictions(y_true, y_score)
        disp.plot()
        plt.title(f"ROC Curve - {experiment_name}")
        plot_file = os.path.join(output_dir, "roc_curve.png")
        plt.savefig(plot_file)
        plt.close()
        return plot_file
    else:
        # Fallback if y_score not available
        plt.figure()
        plt.text(0.5, 0.5, "ROC Curve Unavailable (y_score missing)", ha='center')
        plot_file = os.path.join(output_dir, "roc_curve_error.png")
        plt.savefig(plot_file)
        plt.close()
        return plot_file

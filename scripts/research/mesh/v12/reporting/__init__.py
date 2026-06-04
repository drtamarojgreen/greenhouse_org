from .plots import NativeVisualizer
from .metrics import METRIC_REGISTRY
from .exporters import EXPORT_REGISTRY

PLOT_REGISTRY = {
    "NativeVisualizer": NativeVisualizer
}

import config
from registry import registry
# Data-driven components
import modeling.procedural
import rigging.procedural
import shading.universal
import animation.universal

def initialize_registry():
    """Explicitly import all components to ensure they register themselves."""
    pass

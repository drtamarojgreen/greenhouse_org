import config
from registry import registry
# Data-driven components
import modeling.procedural
import modeling.plant
import rigging.procedural
import rigging.plant
import shading.universal
import animation.universal
import environment.exterior
import environment.interior
import environment.backdrop

def initialize_registry():
    """Explicitly import all components to ensure they register themselves."""
    pass

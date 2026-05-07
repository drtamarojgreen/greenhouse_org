import movie_configuration as mc
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
import environment.forest_road
import environment.mountain_base

def initialize_registry():
    """
    Explicitly import all components to ensure they register themselves.
    Feature Kept: Manual registry initialization ensures that all dynamic
    components are available before the Director begins scene assembly.
    """
    pass

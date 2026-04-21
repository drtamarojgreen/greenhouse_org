# Explicitly import all components to trigger registration
from .modeling import plant
from .rigging import plant
from .shading import plant
from .animation import plant

def initialize_registry():
    """Triggering this ensures all modules are loaded."""
    pass

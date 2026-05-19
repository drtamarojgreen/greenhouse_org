from . import modelers
from . import riggers
from . import shaders

def initialize_registry():
    """
    Ensures all components are imported and registered.
    """
    # Simply mentioning them ensures the modules are loaded if they haven't been
    _ = modelers
    _ = riggers
    _ = shaders

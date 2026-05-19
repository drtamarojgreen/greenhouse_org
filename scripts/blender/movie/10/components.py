import sys
import os

# Add self to sys.modules as 'components' if not already there
if 'components' not in sys.modules:
    sys.modules['components'] = sys.modules[__name__]

try:
    import modelers
    import riggers
    import shaders
except (ImportError, ModuleNotFoundError):
    try:
        from . import modelers
        from . import riggers
        from . import shaders
    except (ImportError, ValueError):
        # Last ditch effort for direct execution
        sys.path.append(os.path.dirname(__file__))
        import modelers
        import riggers
        import shaders

def initialize_registry():
    """
    Ensures all components are imported and registered.
    """
    # Simply mentioning them ensures the modules are loaded if they haven't been
    _ = modelers
    _ = riggers
    _ = shaders

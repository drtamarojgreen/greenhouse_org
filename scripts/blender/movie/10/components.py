import sys
import os

# Add self to sys.modules as 'components' if not already there
if 'components' not in sys.modules:
    sys.modules['components'] = sys.modules[__name__]

try:
    try:
        import modelers
        import riggers
        import shaders
    except (ImportError, ModuleNotFoundError):
        from . import modelers
        from . import riggers
        from . import shaders
except (ImportError, ValueError, ModuleNotFoundError):
    # Fallback for complex nesting in tests
    curr = os.path.dirname(__file__)
    if curr not in sys.path: sys.path.insert(0, curr)
    import modelers
    import riggers
    import shaders

def initialize_registry():
    """
    Ensures all components are imported and registered.
    """
    _ = modelers
    _ = riggers
    _ = shaders

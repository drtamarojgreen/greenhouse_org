try:
    from modeling import plant
    from rigging import plant
    from shading import plant
    from animation import plant
except ImportError:
    from .modeling import plant
    from .rigging import plant
    from .shading import plant
    from .animation import plant

def initialize_registry(): pass

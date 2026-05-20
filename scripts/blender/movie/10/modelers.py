try:
    import bpy
    import bmesh
    import mathutils
except ImportError:
    bpy = None
    bmesh = None
    mathutils = None

    import bpy
    import bmesh
    import mathutils
except ImportError:
    bpy = None
    bmesh = None
    mathutils = None
    import bpy
    import bmesh
    import mathutils
except ImportError:
    bpy = None
    bmesh = None
    mathutils = None

    from .base import Modeler
    from .registry import registry
except (ImportError, ValueError):
    from base import Modeler
    from registry import registry

class PlantModeler(Modeler):
    def build_mesh(self, char_id, params, rig=None):
        return None
registry.register_modeling("PlantModeler", PlantModeler)

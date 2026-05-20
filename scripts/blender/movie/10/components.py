try:
    import bpy
    import bmesh
    import mathutils
except ImportError:
    bpy = None
    bmesh = None
    mathutils = None

import os
import sys

def initialize_registry():
        from . import modelers, riggers, shaders
    except (ImportError, ValueError):
        import modelers, riggers, shaders

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
    try:
        from . import modelers, riggers, shaders
        from .modeling import plant, procedural, greenhouse_mobile
        from .rigging import plant as plant_rigging, procedural as procedural_rigging
        from .shading import universal as universal_shading
        from .animation import universal as universal_animation
        from .environment import exterior, interior, backdrop, forest_road, mountain_base
    except (ImportError, ValueError):
        import modelers, riggers, shaders
        from modeling import plant, procedural, greenhouse_mobile
        from rigging import plant as plant_rigging, procedural as procedural_rigging
        from shading import universal as universal_shading
        from animation import universal as universal_animation
        from environment import exterior, interior, backdrop, forest_road, mountain_base

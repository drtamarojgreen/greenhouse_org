import bpy
import os
import sys
import math
import mathutils
import random
import style
from constants import SCENE_MAP

def ensure_dependencies():
    """Point 6: Centralized dependency management."""
    import site
    paths = site.getsitepackages()
    if hasattr(site, 'getusersitepackages'):
        paths.append(site.getusersitepackages())

    for p in paths:
        if os.path.exists(p) and p not in sys.path:
            sys.path.append(p)

class BaseMaster:
    """Point 5: Shared logic for MovieMaster and SequelMaster."""
    def __init__(self, mode='SILENT_FILM', total_frames=15000):
        self.mode = mode
        self.total_frames = total_frames

        # Point 2: Initialize all instance attributes in __init__
        self.scene = None
        self.brain = None
        self.neuron = None
        self.h1 = None
        self.h2 = None
        self.gnome = None
        self.scroll = None
        self.book = None
        self.pedestal = None
        self.flower = None
        self.greenhouse = None
        self.beam = None # Point 11: Guarded in animate_master

        # Lights
        self.sun = None
        self.fill = None
        self.rim = None
        self.spot = None

        ensure_dependencies()

    def setup_engine(self):
        """Standard engine setup."""
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.delete()

        scene = bpy.context.scene
        scene.frame_start = 1
        scene.frame_end = self.total_frames
        scene.render.fps = 24

        scene.render.resolution_x = 1280
        scene.render.resolution_y = 720

        if self.mode == 'SILENT_FILM':
            scene.render.engine = 'CYCLES'
            scene.cycles.device = 'GPU'
            scene.cycles.samples = 32
            scene.cycles.use_denoising = True
            scene.world.use_nodes = True
            bg = scene.world.node_tree.nodes.get("Background")
            if bg: bg.inputs[0].default_value = (0, 0, 0, 1)
        else:
            scene.render.engine = style.get_eevee_engine_id()
            scene.world.use_nodes = True
            bg = scene.world.node_tree.nodes.get("Background")
            if bg: bg.inputs[0].default_value = (0.05, 0.05, 0.1, 1)

        self.scene = scene
        return scene

    def setup_lighting(self):
        """Common lighting setup."""
        bpy.ops.object.light_add(type='SUN', location=(10, -10, 20))
        self.sun = bpy.context.object
        self.sun.name = "Sun"
        self.sun.data.energy = 5.0

        bpy.ops.object.light_add(type='POINT', location=(-10, -10, 10))
        self.fill = bpy.context.object
        self.fill.name = "FillLight"
        self.fill.data.energy = 2000

        bpy.ops.object.light_add(type='AREA', location=(0, 15, 5))
        self.rim = bpy.context.object
        self.rim.name = "RimLight"
        self.rim.data.energy = 5000

        bpy.ops.object.light_add(type='SPOT', location=(0, -15, 10))
        self.spot = bpy.context.object
        self.spot.name = "Spot"
        self.spot.data.energy = 10000

    def load_common_assets(self):
        """Loads assets shared across productions."""
        # This will be overridden or called by children
        pass

    def _set_visibility(self, objs, ranges):
        """Point 21: Consolidated visibility logic."""
        for obj in objs:
            obj.hide_render = True
            for rs, re in ranges:
                obj.keyframe_insert(data_path="hide_render", frame=rs-1)
                obj.hide_render = False
                obj.keyframe_insert(data_path="hide_render", frame=rs)
                obj.hide_render = True
                obj.keyframe_insert(data_path="hide_render", frame=re)

                # Ensure Boolean keyframes are CONSTANT
                if obj.animation_data and obj.animation_data.action:
                    for fcurve in style.get_action_curves(obj.animation_data.action):
                        if fcurve.data_path == "hide_render":
                            for kp in fcurve.keyframe_points:
                                kp.interpolation = 'CONSTANT'

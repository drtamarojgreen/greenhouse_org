import bpy
import os
import sys
import math
import mathutils
import random
import style
import scene_utils
from constants import SCENE_MAP, QUALITY_PRESETS

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
    def __init__(self, mode='SILENT_FILM', total_frames=15000, quality='test', device_type='HIP'):
        self.mode = mode
        self.total_frames = total_frames
        self.quality = quality
        self.device_type = device_type # Point 66: Configurable device

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
        """Standard engine setup with quality presets and color management."""
        # Point 4: Aggressive cleanup to prevent memory leaks from previous runs
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.delete()
        
        # Purge unused data blocks (meshes, materials, textures, etc.)
        for _ in range(3): # Purge multiple times to handle nested dependencies
             bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)

        scene = bpy.context.scene
        scene.frame_start = 1
        scene.frame_end = self.total_frames
        scene.render.fps = 24

        scene.render.resolution_x = 1280
        scene.render.resolution_y = 720

        # Point 62: Default render output
        scene.render.filepath = f"//renders/{'sequel' if self.total_frames == 6000 else 'full_movie'}/"

        # Point 61: Color Management (Filmic is default in modern Blender, but we ensure it)
        scene.display_settings.display_device = 'sRGB'
        if hasattr(scene.view_settings, "view_transform"):
            scene.view_settings.view_transform = 'Filmic'

        # Point 65: Motion Blur
        scene.render.use_motion_blur = True

        if self.mode == 'SILENT_FILM':
            scene.render.engine = 'CYCLES'

            # Point 66: GPU device selection
            try:
                prefs = bpy.context.preferences.addons['cycles'].preferences
                prefs.compute_device_type = self.device_type
                prefs.get_devices()
                for device in prefs.devices:
                    if device.type == self.device_type:
                        device.use = True
            except Exception:
                pass

            scene.cycles.device = 'GPU'

            # Point 30 & 67: Quality settings
            q = QUALITY_PRESETS.get(self.quality, QUALITY_PRESETS['test'])
            scene.cycles.samples = q['samples']
            scene.cycles.use_denoising = q['denoising']
            if hasattr(scene.cycles, "denoiser"):
                scene.cycles.denoiser = 'OPENIMAGEDENOISE'

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

    def run(self, start_frame=None, end_frame=None, quick=False):
        """Runs the full pipeline. Point 59 & 70: Optimized for targeted ranges and quick testing."""
        self.setup_engine()
        if start_frame is not None: self.scene.frame_start = start_frame
        if end_frame is not None: self.scene.frame_end = end_frame

        self.load_assets()
        if quick: return # Skip heavy setup and animation for structural tests

        self.setup_lighting()
        self.setup_compositor()
        self.animate_master()

    def load_assets(self):
        """Must be overridden by subclass."""
        pass

    def animate_master(self):
        """Must be overridden by subclass."""
        pass

    def setup_compositor(self):
        """Must be overridden by subclass."""
        pass

    def create_intertitle(self, text, frame_start, frame_end):
        return scene_utils.create_intertitle(self, text, frame_start, frame_end)

    def create_spinning_logo(self, text_content, frame_start, frame_end):
        return scene_utils.create_spinning_logo(self, text_content, frame_start, frame_end)

    def create_diagnostic_highlight(self, name, location, frame_start, frame_end, color=(1, 0.5, 0, 1)):
        return scene_utils.create_diagnostic_highlight(self, name, location, frame_start, frame_end, color)

    def create_thought_spark(self, start_loc, end_loc, frame_start, frame_end):
        return scene_utils.create_thought_spark(self, start_loc, end_loc, frame_start, frame_end)

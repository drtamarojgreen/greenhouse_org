import bpy
import os
import sys
import math
import mathutils
import random
import style_utilities as style
import scene_utils
from constants import SCENE_MAP, QUALITY_PRESETS

def ensure_dependencies():
    import site
    paths = site.getsitepackages()
    if hasattr(site, 'getusersitepackages'): paths.append(site.getusersitepackages())
    for p in paths:
        if os.path.exists(p) and p not in sys.path: sys.path.append(p)

class BaseMaster:
    """Exclusive 5.0+ BaseMaster."""
    def __init__(self, mode='SILENT_FILM', total_frames=15000, quality='test', device_type='HIP'):
        self.mode, self.total_frames, self.quality, self.device_type = mode, total_frames, quality, device_type
        self.scene = self.brain = self.neuron = self.h1 = self.h2 = self.gnome = self.scroll = self.book = self.pedestal = self.flower = self.greenhouse = self.beam = None
        self.sun = self.fill = self.rim = self.spot = None
        ensure_dependencies()

    def setup_engine(self):
        style.clear_scene_selective()
        scene = bpy.context.scene; scene.frame_start, scene.frame_end, scene.render.fps = 1, self.total_frames, 24
        scene.render.resolution_x, scene.render.resolution_y = 1280, 720
        scene.render.filepath = f"//renders/{'sequel' if self.total_frames == 6000 else 'full_movie'}/"
        scene.display_settings.display_device, scene.view_settings.view_transform = 'sRGB', 'Filmic'
        # Point 142: Increase exposure for better visibility in underexposed environments
        scene.view_settings.exposure = 1.5
        scene.render.use_motion_blur = True

        if self.mode == 'SILENT_FILM':
            scene.render.engine = 'CYCLES'
            prefs = bpy.context.preferences.addons['cycles'].preferences
            prefs.compute_device_type = self.device_type; prefs.get_devices()
            for d in prefs.devices:
                if d.type == self.device_type: d.use = True
            scene.cycles.device = 'GPU'
            q = QUALITY_PRESETS.get(self.quality, QUALITY_PRESETS['test'])
            scene.cycles.samples, scene.cycles.use_denoising, scene.cycles.denoiser = q['samples'], q['denoising'], 'OPENIMAGEDENOISE'
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
        bpy.ops.object.light_add(type='SUN', location=(10, -10, 20)); self.sun = bpy.context.object; self.sun.data.energy = 5.0
        bpy.ops.object.light_add(type='POINT', location=(-10, -10, 10)); self.fill = bpy.context.object; self.fill.data.energy = 2000
        bpy.ops.object.light_add(type='AREA', location=(0, 15, 5)); self.rim = bpy.context.object; self.rim.data.energy = 5000
        bpy.ops.object.light_add(type='SPOT', location=(0, -15, 10)); self.spot = bpy.context.object; self.spot.data.energy = 10000

    def _set_visibility(self, objs, ranges):
        for obj in objs:
            # Point 142: Ensure we target all meshes in hierarchy
            all_objs = [obj] + list(obj.children)
            for o in all_objs:
                # Default hidden at start
                o.hide_render = True
                o.keyframe_insert(data_path="hide_render", frame=1)
                for rs, re in ranges:
                    if rs > 1:
                        o.hide_render = True
                        o.keyframe_insert(data_path="hide_render", frame=rs-1)
                    o.hide_render = False; o.keyframe_insert(data_path="hide_render", frame=rs)
                    o.hide_render = True; o.keyframe_insert(data_path="hide_render", frame=re)
                    if o.animation_data and o.animation_data.action:
                        for fc in style.get_action_curves(o.animation_data.action):
                            if fc.data_path == "hide_render":
                                for kp in fc.keyframe_points: kp.interpolation = 'CONSTANT'

    def run(self, start_frame=None, end_frame=None, quick=False):
        self.setup_engine()
        if start_frame is not None: self.scene.frame_start = start_frame
        if end_frame is not None: self.scene.frame_end = end_frame
        self.load_assets()
        if quick: return
        self.setup_lighting(); self.setup_compositor(); self.animate_master()

    def load_assets(self): pass
    def animate_master(self): pass
    def setup_compositor(self): pass
    def create_intertitle(self, text, frame_start, frame_end): return scene_utils.create_intertitle(self, text, frame_start, frame_end)
    def create_spinning_logo(self, text, frame_start, frame_end): return scene_utils.create_spinning_logo(self, text, frame_start, frame_end)
    def create_thought_spark(self, start, end, f_start, f_end): return scene_utils.create_thought_spark(self, start, end, f_start, f_end)

    def place_character(self, char, location=None, rotation=None, frame=None):
        """Helper to position and key a character to prevent drifting (Point 142)."""
        if not char: return
        if location:
            char.location = location
            if frame is not None: char.keyframe_insert(data_path="location", frame=frame)
        if rotation:
            char.rotation_euler = rotation
            if frame is not None: char.keyframe_insert(data_path="rotation_euler", frame=frame)

    def hold_position(self, obj, frame_start, frame_end):
        """Keys current position at start and end of range to prevent drifting (Point 142)."""
        if not obj: return
        obj.keyframe_insert(data_path="location", frame=frame_start)
        obj.keyframe_insert(data_path="location", frame=frame_end)
        obj.keyframe_insert(data_path="rotation_euler", frame=frame_start)
        obj.keyframe_insert(data_path="rotation_euler", frame=frame_end)

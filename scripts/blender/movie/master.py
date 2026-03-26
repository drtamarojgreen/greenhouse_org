import bpy
import os
import sys
import math
import mathutils
import random
import style_utilities as style
import scene_utils
from constants import SCENE_MAP, QUALITY_PRESETS
from profiler import Profiler

# Wilderness set coordinates relative to origin
WILDERNESS_SETS = {
    'scene00_branding': (0, -500, 0),
    'scene01_intro': (500, 0, 0),
    'scene_brain': (1000, 0, 0),
    'scene02_garden': (1500, 0, 0),
    'scene03_socratic': (2000, 0, 0),
    'scene04_forge': (2500, 0, 0),
    'scene05_bridge': (3000, 0, 0),
    'scene06_resonance': (3500, 0, 0),
    'scene07_shadow': (4000, 0, 0),
    'scene08_confrontation': (4500, 0, 0),
    'scene09_library': (5000, 0, 0),
    'scene10_futuristic_lab': (5500, 0, 0),
    'scene11_nature_sanctuary': (6000, 0, 0),
}

def ensure_dependencies():
    import site
    paths = site.getsitepackages()
    if hasattr(site, 'getusersitepackages'): paths.append(site.getusersitepackages())
    for p in paths:
        if os.path.exists(p) and p not in sys.path: sys.path.append(p)

class BaseMaster:
    """Exclusive 5.0+ BaseMaster."""
    def __init__(self, mode='SILENT_FILM', total_frames=15000, quality='test', device_type='HIP', use_motion_blur=True, output_dir=None, chroma_green=False):
        self.mode, self.total_frames, self.quality, self.device_type = mode, total_frames, quality, device_type
        self.use_motion_blur, self.chroma_green = use_motion_blur, chroma_green
        self.output_dir = output_dir
        self.scene = self.brain = self.neuron = self.h1 = self.h2 = self.gnome = self.scroll = self.book = self.pedestal = self.flower = self.greenhouse = self.beam = None
        self.sun = self.fill = self.rim = self.spot = None
        ensure_dependencies()

    def setup_engine(self):
        with Profiler.profile("setup_engine"):
            style.clear_scene_selective()
            scene = bpy.context.scene; scene.frame_start, scene.frame_end, scene.render.fps = 1, self.total_frames, 24
            
            q = QUALITY_PRESETS.get(self.quality, QUALITY_PRESETS['test'])
            res_scale = q.get('resolution_scale', 100)
            
            scene.render.resolution_x, scene.render.resolution_y = 1920, 1080
            scene.render.resolution_percentage = res_scale
            # Point 142: Use 5-digit padding (#####) for high-frame-count movie production
            if self.output_dir:
                scene.render.filepath = os.path.join(self.output_dir, "#####")
            else:
                scene.render.filepath = f"//renders/{'sequel' if self.total_frames == 6000 else 'full_movie'}/#####"
            scene.display_settings.display_device, scene.view_settings.view_transform = 'sRGB', 'Filmic'
            # Point 142: Moderated exposure for Cycles (standardized at 0.2 to resolve whiteout)
            scene.view_settings.exposure = 0.2
            scene.render.use_motion_blur = self.use_motion_blur
            scene.render.film_transparent = not self.chroma_green
            
            if self.chroma_green:
                # Point 155: Chroma Green setup
                if scene.world and scene.world.node_tree:
                    bg = scene.world.node_tree.nodes.get("Background")
                    if bg: bg.inputs[0].default_value = (0, 1, 0, 1); bg.inputs[1].default_value = 1.0
                elif scene.world:
                    scene.world.color = (0, 1, 0)

            # Phase 0: Explicit Compute Device Enforcement
            if scene.render.engine == 'CYCLES':
                cprops = bpy.context.preferences.addons['cycles'].preferences
                try:
                    cprops.compute_device_type = self.device_type
                    cprops.get_devices()
                    for d in cprops.devices:
                        d.use = True
                    scene.cycles.device = 'GPU'
                    print(f"Cycles: Device type set to {self.device_type}")
                except Exception as e:
                    print(f"Cycles: Could not set device to {self.device_type}, falling back to CPU. Error: {e}")
                    scene.cycles.device = 'CPU'

            if self.mode == 'SILENT_FILM':
                scene.render.engine = style.get_eevee_engine_id()
                q = QUALITY_PRESETS.get(self.quality, QUALITY_PRESETS['test'])
                scene.eevee.taa_render_samples = q['samples']
                
                # Eevee-specific optimizations (Blender 5.0 handles these differently)
                if hasattr(scene.eevee, "use_gtao"): scene.eevee.use_gtao = True
                if hasattr(scene.eevee, "use_bloom"): scene.eevee.use_bloom = True
                if hasattr(scene.eevee, "use_ssr"): scene.eevee.use_ssr = True
                if hasattr(scene.eevee, "use_volumetric_shadows"): scene.eevee.use_volumetric_shadows = True
                
                bg = scene.world.node_tree.nodes.get("Background")
                if bg: bg.inputs[0].default_value = (0, 0, 0, 1)
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
        with Profiler.profile("setup_lighting"):
            # Point 142: Sane baseline for Cycles SUN
            bpy.ops.object.light_add(type='SUN', location=(10, -10, 20)); self.sun = bpy.context.object; self.sun.data.energy = 1.5
            bpy.ops.object.light_add(type='POINT', location=(-10, -10, 10)); self.fill = bpy.context.object; self.fill.data.energy = 2000
            bpy.ops.object.light_add(type='AREA', location=(0, 15, 5)); self.rim = bpy.context.object; self.rim.data.energy = 5000
            bpy.ops.object.light_add(type='SPOT', location=(0, -15, 10)); self.spot = bpy.context.object; self.spot.data.energy = 10000

    def _set_visibility(self, objs, ranges):
        """Phase 6 Visibility: Ensure Z is restored and keyed correctly."""
        with Profiler.profile("set_visibility"):
            for obj in objs:
                def process_recursive(obj):
                    if not obj.animation_data: obj.animation_data_create()
                    orig_z = obj.location.z
                    # Default hidden and underground at start
                    obj.hide_render = obj.hide_viewport = True
                    obj.keyframe_insert(data_path="hide_render", frame=1)
                    obj.location.z = -50.0
                    obj.keyframe_insert(data_path="location", index=2, frame=1)
                    
                    for rs, re in ranges:
                        if rs > 1:
                            # Ensure hidden and underground just before the scene starts
                            obj.hide_render = obj.hide_viewport = True
                            obj.keyframe_insert(data_path="hide_render", frame=rs-1)
                            obj.location.z = -50.0
                            obj.keyframe_insert(data_path="location", index=2, frame=rs-1)
                        
                        # Visible and Above Ground
                        obj.hide_render = obj.hide_viewport = False
                        obj.keyframe_insert(data_path="hide_render", frame=rs)
                        obj.location.z = orig_z # Restore to where it was created
                        obj.keyframe_insert(data_path="location", index=2, frame=rs)
                        
                        # Hidden and Underground again at end
                        obj.hide_render = obj.hide_viewport = True
                        obj.keyframe_insert(data_path="hide_render", frame=re)
                        obj.location.z = -50.0
                        obj.keyframe_insert(data_path="location", index=2, frame=re)
                    
                    obj.location.z = orig_z
                    for fc in style.get_action_curves(obj.animation_data.action, obj=obj):
                        if "hide_render" in fc.data_path or ("location" in fc.data_path and fc.array_index == 2):
                            for kp in fc.keyframe_points: kp.interpolation = 'CONSTANT'
                    
                    for child in obj.children:
                        process_recursive(child)
                process_recursive(obj)

    def run(self, start_frame=None, end_frame=None, quick=False):
        self.start_frame = start_frame if start_frame is not None else 1
        self.end_frame = end_frame if end_frame is not None else self.total_frames
        
        self.setup_engine()
        self.scene.frame_start = self.start_frame
        self.scene.frame_end = self.end_frame
        
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

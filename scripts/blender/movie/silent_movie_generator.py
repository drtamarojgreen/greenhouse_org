import sys
import os

# Add the directory of this script to the Python path
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.append(script_dir)

import bpy, os, sys, math, mathutils, random, logging
import setup_engine, camera_controls, lighting_setup, compositor_settings, scene_orchestrator, scene_utils, setup_characters, animate_characters, animate_props, detail_config
from assets import plant_humanoid, gnome_antagonist, library_props, futuristic_props, greenhouse_structure, environment_props, weather_system, exterior_garden, greenhouse_interior, brain_neuron
from master import BaseMaster
from constants import SCENE_MAP
import style_utilities as style
from profiler import Profiler
import time
import fcntl

# Import scene modules
from scene00_branding import scene_logic as scene00
from scene01_intro import scene_logic as scene01
from scene02_garden import scene_logic as scene02
from scene03_socratic import scene_logic as scene03
from scene04_forge import scene_logic as scene04
from scene05_bridge import scene_logic as scene05
from scene06_resonance import scene_logic as scene06
from scene07_shadow import scene_logic as scene07
from scene08_confrontation import scene_logic as scene08
from scene09_library import scene_logic as scene09
from scene10_futuristic_lab import scene_logic as scene10
from scene11_nature_sanctuary import scene_logic as scene11
from scene12_credits import scene_logic as scene12
from scene13_walking import scene_logic as scene13
from scene14_duel import scene_logic as scene14
from scene15_interaction import scene_logic as scene15
from scene_brain import scene_logic as scene_brain

def safe_import_scene(name):
    try: return __import__(f"{name}.scene_logic", fromlist=['scene_logic'])
    except ImportError: return None

# Point 142: Dynamically import dialogue and retreat scenes (Named for test discovery)
scene16_dialogue, scene17_dialogue, scene18_dialogue, scene19_dialogue, scene20_dialogue, scene21_dialogue, scene22_retreat = \
    [safe_import_scene(f"scene{i}_dialogue") for i in range(16, 22)] + [safe_import_scene("scene22_retreat")]

class MovieMaster(BaseMaster):
    def __init__(self, mode='SILENT_FILM', quality='test', device_type='HIP', use_motion_blur=True, output_dir=None):
        super().__init__(mode=mode, total_frames=15000, quality=quality, device_type=device_type, use_motion_blur=use_motion_blur, output_dir=output_dir)

    def load_assets(self):
        # Point 142: Ensure camera exists early for lighting setup
        with Profiler.profile("load_assets"):
            camera_controls.ensure_camera(self)
            
            base_p = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            self.greenhouse = greenhouse_structure.create_greenhouse_structure(location=(0, 15, 0))
            greenhouse_interior.setup_greenhouse_interior()
            exterior_garden.create_exterior_garden()
            environment_props.create_stage_floor()
            environment_props.setup_volumetric_haze()
            setup_characters.setup_all_characters(self)
            self.brain, self.neuron = brain_neuron.load_brain(base_p), brain_neuron.load_neuron(base_p)
            self.book = library_props.create_open_book((0, 0, 1.3))
            self.pedestal = library_props.create_pedestal((0, 0, 0))
            # Trees: placed inside the greenhouse walls (which are now at Y+15)
            _bark = plant_humanoid.create_bark_material("GH_TreeBark")
            _leaf = plant_humanoid.create_leaf_material("GH_TreeLeaf")
            for x, y in [(-6, 8), (6, 8), (-6, 22), (6, 22)]:
                exterior_garden.create_procedural_tree((x, y, -1), _bark, _leaf)

    def animate_master(self):
        with Profiler.profile("animate_master"):
            camera_controls.setup_all_camera_logic(self); setup_characters.setup_gaze_system(self)
            scene_orchestrator.orchestrate_scenes(self); animate_characters.animate_characters(self); animate_props.animate_props(self)
            
            # Point 142: Visibility management for main actors & Secondary props
            hero_ranges = [(max(101, self.start_frame), self.end_frame)]
            if self.h1 and self.h2:
                self._set_visibility([self.h1, self.h2], hero_ranges)
            if self.gnome:
                # Clamp gnome range to current chunk
                gnome_start = max(10901, self.start_frame)
                gnome_end = min(14450, self.end_frame)
                if gnome_start <= gnome_end:
                    self._set_visibility([self.gnome], [(gnome_start, gnome_end)])
            
            # Point 142: Post-animation camera health check (Prevent "Drunk Cameraman" occlusions)
            cam = bpy.data.objects.get("MovieCamera")
            if cam:
                chars = [c for c in [self.h1, self.h2, self.gnome] if c]
                camera_controls.apply_camera_safety(self, cam, chars, self.start_frame, self.end_frame)
                
            # Clear "Random Assets" outside greenhouse (#22)
            secondary_props = [o for o in bpy.data.objects if any(x in o.name for x in ["Title", "Logo", "Spark", "Diag", "Book", "Pedestal", "MentalBloom"])]
            # Trees are always visible during the greenhouse interior scenes
            trees = [o for o in bpy.data.objects if o.name.startswith("Tree_")]
            self._set_visibility(trees, [(max(101, self.start_frame), self.end_frame)]) # Trees visible for any scene with characters
            
            # Hide helpers and unwanted lights
            helpers = [bpy.data.objects.get(n) for n in ["CamTarget", "GazeTarget", "IntroLight"]]
            for h in [obj for obj in helpers if obj]:
                style.set_obj_visibility(h, False, 1)
                style.set_obj_visibility(h, False, 7500)
                style.set_obj_visibility(h, False, 15000)
            
            # Point 142: Executing all scenes in chronological order
            # P2-6: Separate sequel-only timeline modules (scene13, scene14) from feature pipeline
            include_sequel = os.environ.get("MOVIE_SEQUEL_MODE") == "1"
            
            all_scenes = [
                scene00, scene01, scene_brain, scene02, scene03, scene04, scene05, 
                scene06, scene07, scene08, scene09, scene10, scene11
            ]
            
            if include_sequel:
                all_scenes += [scene13, scene14]
                
            all_scenes += [
                scene15, scene16_dialogue, scene17_dialogue, scene18_dialogue, 
                scene19_dialogue, scene20_dialogue, scene21_dialogue, scene22_retreat, 
                scene12
            ]
            
            for s in all_scenes:
                if s and hasattr(s, 'setup_scene'):
                    # Discovery of scene name from module path (Point 142)
                    s_name = s.__name__.split('.')[0]
                    if s_name not in SCENE_MAP:
                        # Fallback for directly imported or aliased modules
                        for k in SCENE_MAP:
                            if k in s.__name__:
                                s_name = k; break
                    
                    if s_name in SCENE_MAP:
                        start, end = SCENE_MAP[s_name]
                        # Pre-setup hold: capture current position to prevent drift from previous scene
                        # Phase 6: Reset Z from Holding Pen
                        loc1 = self.h1.location.copy(); loc1.z = 0
                        loc2 = self.h2.location.copy(); loc2.z = 0
                        locG = self.gnome.location.copy(); locG.z = 0
                        self.place_character(self.h1, loc1, self.h1.rotation_euler, start)
                        self.place_character(self.h2, loc2, self.h2.rotation_euler, start)
                        self.place_character(self.gnome, locG, self.gnome.rotation_euler, start)
    
                        # Point 155: Load detail profile
                        self.detail_profile = detail_config.get_detail_profile(s_name)
    
                    s.setup_scene(self)
    
                    if s_name in SCENE_MAP:
                        start, end = SCENE_MAP[s_name]
                        # Post-setup hold: ensure final scene position is keyed to prevent drift to next
    
                        # Point 155: Apply detail layers
                        if hasattr(self, 'detail_profile'):
                            scene_orchestrator.apply_detail_layers(self, s_name, self.detail_profile, start, end)

    def run(self, start_frame=None, end_frame=None, quick=False):
        """Override to profile the total setup phase."""
        with Profiler.profile("total_setup"):
            super().run(start_frame=start_frame, end_frame=end_frame, quick=quick)

    def place_character(self, char, loc, rot, frame):
        """Phase 6: Place character with simple collision avoidance."""
        import mathutils
        loc_vec = mathutils.Vector(loc)
        # Simple avoidance: push apart if too close
        others = [self.h1, self.h2, self.gnome]
        for other in others:
            if other != char and other and other.name in bpy.data.objects:
                o_obj = bpy.data.objects[other.name]
                if not o_obj.hide_render:
                    dist = (loc_vec - o_obj.location).length
                    if dist < 0.8 and dist > 0.001: # Personal space
                        offset = (loc_vec - o_obj.location).normalized() * (0.8 - dist)
                        loc_vec += offset
        
        char.location = loc_vec
        char.rotation_euler = rot
        char.keyframe_insert(data_path="location", frame=frame)
        char.keyframe_insert(data_path="rotation_euler", frame=frame)

    def setup_lighting(self):
        with Profiler.profile("setup_lighting_wrapper"):
            lighting_setup.setup_lighting(self)
    def setup_compositor(self):
        with Profiler.profile("setup_compositor_wrapper"):
            compositor_settings.setup_compositor(self)

if __name__ == "__main__":
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    mode = 'UNITY_PREVIEW' if '--unity' in args else 'SILENT_FILM'
    quality = args[args.index('--quality') + 1] if '--quality' in args else 'test'
    device = args[args.index('--device-type') + 1] if '--device-type' in args else 'HIP'
    
    # Point 155: Support motion blur toggle for faster dev renders
    use_blur = '--no-blur' not in args
    
    out_dir = args[args.index('--output-dir') + 1] if '--output-dir' in args else None
    if out_dir and not out_dir.startswith("//") and not os.path.isabs(out_dir):
        out_dir = os.path.abspath(out_dir)

    master = MovieMaster(mode=mode, quality=quality, device_type=device, use_motion_blur=use_blur, output_dir=out_dir)
    
    # Range handling from SCENE_MAP or explicit frames
    start_f, end_f = (None, None)
    if '--scene' in args and args[args.index('--scene') + 1] in SCENE_MAP:
        start_f, end_f = SCENE_MAP[args[args.index('--scene') + 1]]
    
    if '--frame-start' in args:
        start_f = int(args[args.index('--frame-start') + 1])
    if '--frame-end' in args:
        end_f = int(args[args.index('--frame-end') + 1])
        
    master.run(start_frame=start_f, end_frame=end_f)
    if '--render-anim' in args:
        with Profiler.profile("render_frames"):
            bpy.ops.render.render(animation=True)
    
    # Save performance report
    Profiler.save_report("renders/performance_report.json")

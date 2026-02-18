import bpy
import math
import os
import sys
import mathutils
import random
import logging

# Module Imports
import setup_engine
import camera_controls
import lighting_setup
import compositor_settings
import scene_orchestrator
import scene_utils
import setup_characters
import animate_characters
import animate_props

# Asset Imports
from assets import plant_humanoid, gnome_antagonist, library_props, futuristic_props
from assets import greenhouse_structure, environment_props, weather_system
from assets import exterior_garden, greenhouse_interior
from assets import brain_neuron

from master import BaseMaster
from constants import SCENE_MAP
import unity_exporter
import style

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
from scene15_interaction import scene_logic as scene15

# New scenes 16-22
def safe_import_scene(name):
    try:
        module = __import__(f"{name}.scene_logic", fromlist=['scene_logic'])
        return module
    except ImportError as e:
        logging.warning(f"Failed to import {name}: {e}")
        return None

scene16 = safe_import_scene("scene16_dialogue")
scene17 = safe_import_scene("scene17_dialogue")
scene18 = safe_import_scene("scene18_dialogue")
scene19 = safe_import_scene("scene19_dialogue")
scene20 = safe_import_scene("scene20_dialogue")
scene21 = safe_import_scene("scene21_dialogue")
scene22 = safe_import_scene("scene22_retreat")

class MovieMaster(BaseMaster):
    def __init__(self, mode='SILENT_FILM', quality='test', device_type='HIP'):
        super().__init__(mode=mode, total_frames=15000, quality=quality, device_type=device_type)

    def setup_engine(self):
        return setup_engine.setup_blender_engine(self)

    def load_assets(self):
        """Loads models and characters."""
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

        # Environmental Assets
        self.greenhouse = greenhouse_structure.create_greenhouse_structure()
        greenhouse_interior.setup_greenhouse_interior()
        exterior_garden.create_exterior_garden()

        # Weather and FX (Initial setup)
        environment_props.create_stage_floor()
        environment_props.setup_volumetric_haze()
        style.animate_dust_particles(mathutils.Vector((0,0,2)), density=30)

        # Character Assets
        setup_characters.setup_all_characters(self)

        # Scientific Assets
        from assets import brain_neuron
        self.brain = brain_neuron.load_brain(base_path)
        self.neuron = brain_neuron.load_neuron(base_path)

        # Static Props
        self.book = library_props.create_open_book(mathutils.Vector((0, 0, 1.3)))
        self.pedestal = library_props.create_pedestal(mathutils.Vector((0, 0, 0)))
        pillar_locs = [(-8, -8), (8, 8), (-12, 0), (12, 0)]
        for x, y in pillar_locs:
            plant_humanoid.create_inscribed_pillar(mathutils.Vector((x, y, 0)))

    def _animate_characters(self):
        animate_characters.animate_characters(self)

    def _animate_props(self):
        animate_props.animate_props(self)

    def _setup_gaze_system(self):
        setup_characters.setup_gaze_system(self)

    def _setup_camera(self):
        camera_controls.setup_all_camera_logic(self)

    def animate_master(self):
        # Global orchestration
        scene_orchestrator.orchestrate_scenes(self)

        # Individual scene logic
        scenes = [scene00, scene01, None, scene02, scene03, scene04, scene05,
                  scene06, scene07, scene08, scene09, scene10, scene11, scene15,
                  scene16, scene17, scene18, scene19, scene20, scene21, scene22, scene12]

        for scene_mod in scenes:
            if scene_mod and hasattr(scene_mod, 'setup_scene'):
                scene_mod.setup_scene(self)

    def setup_lighting(self):
        lighting_setup.setup_lighting(self)

    def setup_camera_keyframes(self, cam, target):
        camera_controls.setup_camera_keyframes(self, cam, target)

    def setup_compositor(self):
        compositor_settings.setup_compositor(self)

def main():
    argv = sys.argv
    args = argv[argv.index("--") + 1:] if "--" in argv else []
    mode = 'SILENT_FILM'
    if '--unity' in args: mode = 'UNITY_PREVIEW'

    quality = args[args.index('--quality') + 1] if '--quality' in args else 'test'
    device = args[args.index('--device-type') + 1] if '--device-type' in args else 'HIP'

    master = MovieMaster(mode=mode, quality=quality, device_type=device)

    start_f = None
    end_f = None
    if '--scene' in args:
        scene_name = args[args.index('--scene') + 1]
        if scene_name in SCENE_MAP:
            start_f, end_f = SCENE_MAP[scene_name]

    master.run(start_frame=start_f, end_frame=end_f)
    if '--render-anim' in args:
        bpy.ops.render.render(animation=True)

if __name__ == "__main__":
    main()

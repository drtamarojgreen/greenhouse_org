import bpy, os, sys, math, mathutils, random, logging
import setup_engine, camera_controls, lighting_setup, compositor_settings, scene_orchestrator, scene_utils, setup_characters, animate_characters, animate_props
from assets import plant_humanoid, gnome_antagonist, library_props, futuristic_props, greenhouse_structure, environment_props, weather_system, exterior_garden, greenhouse_interior, brain_neuron
from master import BaseMaster
from constants import SCENE_MAP
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
from scene_brain import scene_logic as scene_brain

def safe_import_scene(name):
    try: return __import__(f"{name}.scene_logic", fromlist=['scene_logic'])
    except ImportError: return None

scene16, scene17, scene18, scene19, scene20, scene21, scene22 = [safe_import_scene(f"scene{i}_dialogue") for i in range(16, 22)] + [safe_import_scene("scene22_retreat")]

class MovieMaster(BaseMaster):
    def __init__(self, mode='SILENT_FILM', quality='test', device_type='HIP'):
        super().__init__(mode=mode, total_frames=15000, quality=quality, device_type=device_type)

    def load_assets(self):
        base_p = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.greenhouse = greenhouse_structure.create_greenhouse_structure()
        greenhouse_interior.setup_greenhouse_interior()
        exterior_garden.create_exterior_garden()
        environment_props.create_stage_floor()
        environment_props.setup_volumetric_haze()
        setup_characters.setup_all_characters(self)
        self.brain, self.neuron = brain_neuron.load_brain(base_p), brain_neuron.load_neuron(base_p)
        self.book = library_props.create_open_book((0, 0, 1.3))
        self.pedestal = library_props.create_pedestal((0, 0, 0))
        for x, y in [(-8,-8), (8,8), (-12,0), (12,0)]: plant_humanoid.create_inscribed_pillar((x, y, 0))

    def animate_master(self):
        camera_controls.setup_all_camera_logic(self); setup_characters.setup_gaze_system(self)
        scene_orchestrator.orchestrate_scenes(self); animate_characters.animate_characters(self); animate_props.animate_props(self)
        for s in [scene00, scene01, scene_brain, scene02, scene03, scene04, scene05, scene06, scene07, scene08, scene09, scene10, scene11, scene15, scene16, scene17, scene18, scene19, scene20, scene21, scene22, scene12]:
            if s and hasattr(s, 'setup_scene'): s.setup_scene(self)

    def setup_lighting(self): lighting_setup.setup_lighting(self)
    def setup_compositor(self): compositor_settings.setup_compositor(self)

if __name__ == "__main__":
    args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    mode = 'UNITY_PREVIEW' if '--unity' in args else 'SILENT_FILM'
    quality = args[args.index('--quality') + 1] if '--quality' in args else 'test'
    device = args[args.index('--device-type') + 1] if '--device-type' in args else 'HIP'
    master = MovieMaster(mode=mode, quality=quality, device_type=device)
    start_f, end_f = (SCENE_MAP[args[args.index('--scene') + 1]] if '--scene' in args and args[args.index('--scene') + 1] in SCENE_MAP else (None, None))
    master.run(start_frame=start_f, end_frame=end_f)
    if '--render-anim' in args: bpy.ops.render.render(animation=True)

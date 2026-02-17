import bpy
import math
import os
import sys
import mathutils
import random

from master import BaseMaster
from constants import SCENE_MAP
import plant_humanoid
import gnome_antagonist
import greenhouse_structure
import environment_props
import style

# Import scene modules
from scene00_branding import scene_logic as scene00
from scene12_credits import scene_logic as scene12
from scene13_walking import scene_logic as scene13
from scene14_duel import scene_logic as scene14

class SequelMaster(BaseMaster):
    def __init__(self, mode='SILENT_FILM'):
        super().__init__(mode=mode, total_frames=6000)

    def load_assets(self):
        """Loads models and characters."""
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

        self.greenhouse = greenhouse_structure.create_greenhouse_structure()
        self.gnome = gnome_antagonist.create_gnome("GloomGnome", mathutils.Vector((5, 5, 0)))

        self.h1 = plant_humanoid.create_plant_humanoid("Herbaceous", mathutils.Vector((-2, 0, 0)), height_scale=0.8, seed=42, include_facial_details=True)
        self.h2 = plant_humanoid.create_plant_humanoid("Arbor", mathutils.Vector((2, 1, 0)), height_scale=1.3, seed=123, include_facial_details=True)
        self.scroll = plant_humanoid.create_scroll(mathutils.Vector((1.8, 1.0, 1.2)))

        environment_props.create_stage_floor()
        environment_props.setup_volumetric_haze()

    def _setup_camera(self):
        bpy.ops.object.camera_add(location=(0, -15, 5))
        cam = bpy.context.object
        self.scene.camera = cam

        bpy.ops.object.empty_add(type='PLAIN_AXES')
        target = bpy.context.object
        target.name = "CamTarget"
        target.location = (0, 0, 1.5)

        con = cam.constraints.new(type='TRACK_TO')
        con.target = target
        con.track_axis = 'TRACK_NEGATIVE_Z'
        con.up_axis = 'UP_Y'

    def animate_master(self):
        """Global animation and scene visibility logic for the sequel."""
        plant_keywords = ["Herbaceous", "Arbor", "Scroll", "Bush", "Eye", "Mouth", "ShoulderPlate"]
        plants = [obj for obj in bpy.context.scene.objects if any(k in obj.name for k in plant_keywords) and "GloomGnome" not in obj.name]
        self._set_visibility(plants, [(1, 6000)])

        gnomes = [obj for obj in bpy.context.scene.objects if "GloomGnome" in obj.name]
        self._set_visibility(gnomes, [(4501, 5800)])

        self._setup_camera()

        # Scene Setup
        scene00.setup_scene(self)
        scene13.setup_scene(self) # Walking
        scene14.setup_scene(self) # Duel
        scene12.setup_scene(self) # Credits

    def run(self):
        self.load_assets()
        self.setup_lighting()
        self.animate_master()

def main():
    argv = sys.argv
    args = argv[argv.index("--") + 1:] if "--" in argv else []
    master = SequelMaster(mode='SILENT_FILM')
    style.patch_fbx_importer()
    master.run()

    if '--render-anim' in args:
        bpy.ops.render.render(animation=True)

if __name__ == "__main__":
    main()

import bpy
import math
import os
import sys
import mathutils
import random

# Ensure numpy and other dependencies are found even when Blender's environment is constrained
def ensure_dependencies():
    import site
    # Include user site-packages and system site-packages
    paths = site.getsitepackages()
    if hasattr(site, 'getusersitepackages'):
        paths.append(site.getusersitepackages())

    for p in paths:
        if os.path.exists(p) and p not in sys.path:
            sys.path.append(p)

ensure_dependencies()

# Add movie root and assets to path for local imports
MOVIE_ROOT = os.path.dirname(os.path.abspath(__file__))
ASSETS_ROOT = os.path.join(MOVIE_ROOT, "assets")
for p in [MOVIE_ROOT, ASSETS_ROOT]:
    if p not in sys.path:
        sys.path.append(p)

import plant_humanoid
import gnome_antagonist
import greenhouse_structure
import environment_props

# Import scene modules
from scene00_branding import scene_logic as scene00
from scene12_credits import scene_logic as scene12
from scene13_walking import scene_logic as scene13
from scene14_duel import scene_logic as scene14

def patch_fbx_importer():
    """
    Patches the Blender 5.0 FBX importer to handle missing 'files' attribute.
    Fixes AttributeError: 'ImportFBX' object has no attribute 'files'.
    """
    try:
        import sys
        fbx_module = sys.modules.get('io_scene_fbx')
        if not fbx_module:
            try:
                import io_scene_fbx
                fbx_module = io_scene_fbx
            except ImportError:
                pass

        if fbx_module and hasattr(fbx_module, 'ImportFBX'):
            ImportFBX = fbx_module.ImportFBX
            if not getattr(ImportFBX, '_is_patched', False):
                original_execute = ImportFBX.execute
                def patched_execute(self, context):
                    if not hasattr(self, 'files'):
                        self.files = []
                    return original_execute(self, context)
                ImportFBX.execute = patched_execute
                ImportFBX._is_patched = True
                print("Patched io_scene_fbx.ImportFBX for Blender 5.0 compatibility.")
    except Exception as e:
        print(f"Warning: Failed to patch FBX importer: {e}")

class SequelMaster:
    def __init__(self, mode='SILENT_FILM'):
        self.mode = mode
        self.scene = self.setup_engine()
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

    def setup_engine(self):
        """Initializes the scene for the action-packed sequel."""
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.delete()

        scene = bpy.context.scene
        scene.frame_start = 1
        scene.frame_end = 6000 # Extended for more action
        scene.render.fps = 24

        if self.mode == 'SILENT_FILM':
            scene.render.engine = 'CYCLES'
            scene.cycles.device = 'GPU'
            scene.cycles.samples = 32
            scene.cycles.use_denoising = True
            scene.world.use_nodes = True
            bg = scene.world.node_tree.nodes.get("Background")
            if bg: bg.inputs[0].default_value = (0, 0, 0, 1)
        else:
            scene.render.engine = 'BLENDER_EEVEE'
            scene.world.use_nodes = True
            bg = scene.world.node_tree.nodes.get("Background")
            if bg: bg.inputs[0].default_value = (0.05, 0.05, 0.1, 1)

        scene.render.resolution_x = 1280
        scene.render.resolution_y = 720
        return scene

    def get_action_curves(self, action):
        if hasattr(action, 'fcurves'): return action.fcurves
        if hasattr(action, 'curves'): return action.curves
        return []

    def load_assets(self):
        """Loads models and characters."""
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

        self.greenhouse = greenhouse_structure.create_greenhouse_structure()
        self.gnome = gnome_antagonist.create_gnome("GloomGnome", mathutils.Vector((5, 5, 0)))

        self.h1 = plant_humanoid.create_plant_humanoid("Herbaceous", mathutils.Vector((-2, 0, 0)), height_scale=0.8, seed=42)
        self.h2 = plant_humanoid.create_plant_humanoid("Arbor", mathutils.Vector((2, 1, 0)), height_scale=1.3, seed=123)
        self.scroll = plant_humanoid.create_scroll(mathutils.Vector((1.8, 1.0, 1.2)))

        environment_props.create_stage_floor()
        environment_props.setup_volumetric_haze()

    def animate_master(self):
        """Global animation and scene visibility logic for the sequel."""

        def set_visibility(objs, ranges):
            for obj in objs:
                obj.hide_render = True
                for rs, re in ranges:
                    obj.keyframe_insert(data_path="hide_render", frame=rs-1)
                    obj.hide_render = False
                    obj.keyframe_insert(data_path="hide_render", frame=rs)
                    obj.hide_render = True
                    obj.keyframe_insert(data_path="hide_render", frame=re)

        plant_keywords = ["Herbaceous", "Arbor", "Scroll", "Bush", "Eye", "Mouth", "ShoulderPlate"]
        plants = [obj for obj in bpy.context.scene.objects if any(k in obj.name for k in plant_keywords) and "GloomGnome" not in obj.name]

        # Extended ranges for new action scenes
        p_ranges = [(1, 6000)] # Keep plants visible mostly
        set_visibility(plants, p_ranges)

        gnomes = [obj for obj in bpy.context.scene.objects if "GloomGnome" in obj.name]
        g_ranges = [(4501, 5800)]
        set_visibility(gnomes, g_ranges)

        # Master Camera setup first so scenes can keyframe it
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

        # Scene Setup
        scene00.setup_scene(self)
        scene13.setup_scene(self) # Walking
        scene14.setup_scene(self) # Duel
        scene12.setup_scene(self) # Credits (at the end)

    def setup_lighting(self):
        bpy.ops.object.light_add(type='SUN', location=(10,-10,20))
        sun = bpy.context.object
        sun.data.energy = 5.0

        bpy.ops.object.light_add(type='AREA', location=(0, 15, 5))
        rim = bpy.context.object
        rim.scale = (10, 10, 1)
        rim.data.energy = 5000

    def run(self):
        self.load_assets()
        self.setup_lighting()
        self.animate_master()

def main():
    argv = sys.argv
    args = argv[argv.index("--") + 1:] if "--" in argv else []
    master = SequelMaster(mode='SILENT_FILM')
    patch_fbx_importer()
    master.run()

    if '--render-anim' in args:
        bpy.ops.render.render(animation=True)

if __name__ == "__main__":
    main()

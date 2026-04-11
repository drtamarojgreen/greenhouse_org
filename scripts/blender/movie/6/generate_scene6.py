import bpy
import os
import sys
import time
import math
import mathutils

# Ensure movie modules are in path
V6_DIR = os.path.dirname(os.path.abspath(__file__))
# We want to be able to import from movie.5 and movie.6
MOVIE_DIR = os.path.dirname(V6_DIR)
if MOVIE_DIR not in sys.path:
    sys.path.append(MOVIE_DIR)

# Add V5 directory to path so we can import assets_v5 directly
V5_DIR = os.path.join(MOVIE_DIR, "5")
if V5_DIR not in sys.path:
    sys.path.append(V5_DIR)

from assets_v5.plant_humanoid_v5 import create_plant_humanoid_v5
from chroma_green_setup import setup_chroma_green_backdrop
from asset_manager_v6 import SylvanEnsembleManager
from director_v6 import SylvanDirector

try:
    import config
except ImportError:
    from . import config

# --- COORDINATE CONSTANTS (matching v5) ---
HERB_BASE = (-1.75, -0.3, 0.0)
ARBOR_BASE = (1.75, 0.3, 0.0)
HERB_EYE_LEVEL = (-1.75, -0.3, 2.5)
ARBOR_EYE_LEVEL = (1.75, 0.3, 2.5)

def standardize_ensemble_heights():
    """No-op shim for compatibility with tests/dialogue scripts."""
    print("ASSET_MANAGER: Normalizing Ensemble Heights [SKIPPED]")
    pass

def setup_scene6_cameras():
    """Builds a professional 3-camera cinematic rig matching v5 logic."""
    cameras = {}
    scene = bpy.context.scene

    # 1. FOCAL POINTS
    herb_focus = bpy.data.objects.get("Focus_Herbaceous") or bpy.data.objects.new("Focus_Herbaceous", None)
    herb_focus.location = HERB_EYE_LEVEL
    if herb_focus.name not in scene.collection.objects:
        scene.collection.objects.link(herb_focus)

    arbor_focus = bpy.data.objects.get("Focus_Arbor") or bpy.data.objects.new("Focus_Arbor", None)
    arbor_focus.location = ARBOR_EYE_LEVEL
    if arbor_focus.name not in scene.collection.objects:
        scene.collection.objects.link(arbor_focus)

    # 2. CAMERA: WIDE
    cam_wide_data = bpy.data.cameras.new("WIDE")
    cam_wide_data.lens = 35
    obj_wide = bpy.data.objects.new("WIDE", cam_wide_data)
    scene.collection.objects.link(obj_wide)
    obj_wide.location = (0.0, -8.0, 2.0)
    obj_wide.rotation_euler = (math.radians(90), 0.0, 0.0)
    cameras["WIDE"] = obj_wide

    # 3. CAMERA: OTS1
    cam_herb_data = bpy.data.cameras.new("OTS1")
    cam_herb_data.lens = 50
    obj_herb = bpy.data.objects.new("OTS1", cam_herb_data)
    scene.collection.objects.link(obj_herb)
    obj_herb.location = (13.5, 11.0, 6.0)
    herb_target_vec = mathutils.Vector(HERB_EYE_LEVEL) - mathutils.Vector(obj_herb.location)
    obj_herb.rotation_euler = herb_target_vec.to_track_quat('-Z', 'Y').to_euler()
    cameras["OTS1"] = obj_herb

    # 4. CAMERA: OTS2
    cam_arbor_data = bpy.data.cameras.new("OTS2")
    cam_arbor_data.lens = 50
    obj_arbor = bpy.data.objects.new("OTS2", cam_arbor_data)
    scene.collection.objects.link(obj_arbor)
    obj_arbor.location = (-13.5, -11.0, 6.0)
    arbor_target_vec = mathutils.Vector(ARBOR_EYE_LEVEL) - mathutils.Vector(obj_arbor.location)
    obj_arbor.rotation_euler = arbor_target_vec.to_track_quat('-Z', 'Y').to_euler()
    cameras["OTS2"] = obj_arbor

    return cameras

def generate_full_scene_v6():
    """Master production assembly for Scene 6, matching v5 reliability."""
    start_t = time.time()

    # 0. PURGE (v5 scorched-earth style)
    print("PURGE: Removing all persistent data blocks...")
    for coll in list(bpy.data.collections):
        for obj in list(coll.objects):
            try:
                coll.objects.unlink(obj)
            except: pass

    for block in [bpy.data.objects, bpy.data.meshes, bpy.data.cameras,
                  bpy.data.lights, bpy.data.materials, bpy.data.actions, bpy.data.worlds]:
        for item in list(block):
            try:
                block.remove(item, do_unlink=True)
            except Exception:
                pass

    # 1. Backdrop
    setup_chroma_green_backdrop()

    # 2. Protagonists (v5 procedural)
    create_plant_humanoid_v5(config.CHAR_HERBACEOUS, HERB_BASE)
    create_plant_humanoid_v5(config.CHAR_ARBOR, ARBOR_BASE)

    # 3. Sylvan Ensemble (spirits)
    asset_manager = SylvanEnsembleManager()
    asset_manager.link_ensemble()
    asset_manager.renormalize_objects() # Syncs meshes to rigs

    # 4. Cameras
    cameras = setup_scene6_cameras()
    if "WIDE" in cameras:
        bpy.context.scene.camera = cameras["WIDE"]

    # 5. Positioning
    director = SylvanDirector()
    director.position_protagonists()
    director.compose_ensemble()

    bpy.context.view_layer.update()
    print(f"SUCCESS: Scene 6 assembled in {time.time() - start_t:.2f}s")

if __name__ == "__main__":
    generate_full_scene_v6()

import bpy
import os
import sys

# prioritize movie/6 and assets_v6 for absolute imports
V6_DIR = os.path.dirname(os.path.abspath(__file__))
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)

ASSETS_V6_DIR = os.path.join(V6_DIR, "assets_v6")
if ASSETS_V6_DIR not in sys.path: sys.path.insert(0, ASSETS_V6_DIR)

# Prioritize movie/ for style_utilities
MOVIE_DIR = os.path.dirname(V6_DIR)
if MOVIE_DIR not in sys.path: sys.path.insert(0, MOVIE_DIR)

import config
import plant_humanoid_v6
import asset_manager_v6
import director_v6
import camera_rig_v6
import chroma_green_setup

# --- COORDINATE CONSTANTS (production requirements) ---
HERB_BASE = (-1.75, -0.3, 0.0)
ARBOR_BASE = (1.75, 0.3, 0.0)
HERB_EYE_LEVEL = (-1.75, -0.3, 2.5)
ARBOR_EYE_LEVEL = (1.75, 0.3, 2.5)

def standardize_ensemble_heights():
    """No-op shim."""
    print("ASSET_MANAGER: Normalizing Ensemble Heights [SKIPPED]")
    pass

def setup_scene6_cameras():
    """Builds rig."""
    import math
    import mathutils
    cameras = {}
    scene = bpy.context.scene

    herb_focus = bpy.data.objects.get("Focus_Herbaceous") or bpy.data.objects.new("Focus_Herbaceous", None)
    herb_focus.location = HERB_EYE_LEVEL
    if herb_focus.name not in scene.collection.objects: scene.collection.objects.link(herb_focus)

    arbor_focus = bpy.data.objects.get("Focus_Arbor") or bpy.data.objects.new("Focus_Arbor", None)
    arbor_focus.location = ARBOR_EYE_LEVEL
    if arbor_focus.name not in scene.collection.objects: scene.collection.objects.link(arbor_focus)

    cam_wide_data = bpy.data.cameras.new("WIDE")
    cam_wide_data.lens = 35
    obj_wide = bpy.data.objects.new("WIDE", cam_wide_data)
    scene.collection.objects.link(obj_wide)
    obj_wide.location = (0.0, -8.0, 2.0)
    obj_wide.rotation_euler = (math.radians(90), 0.0, 0.0)
    cameras["WIDE"] = obj_wide

    cam_herb_data = bpy.data.cameras.new("OTS1")
    cam_herb_data.lens = 50
    obj_herb = bpy.data.objects.new("OTS1", cam_herb_data)
    scene.collection.objects.link(obj_herb)
    obj_herb.location = (13.5, 11.0, 6.0)
    herb_target_vec = mathutils.Vector(HERB_EYE_LEVEL) - mathutils.Vector(obj_herb.location)
    obj_herb.rotation_euler = herb_target_vec.to_track_quat('-Z', 'Y').to_euler()
    cameras["OTS1"] = obj_herb

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
    """Master production assembly."""
    import time
    start_t = time.time()

    am = asset_manager_v6.SylvanEnsembleManager()
    am.ensure_clean_slate()

    chroma_green_setup.setup_chroma_green_backdrop()

    plant_humanoid_v6.create_plant_humanoid_v6(config.CHAR_HERBACEOUS, HERB_BASE)
    plant_humanoid_v6.create_plant_humanoid_v6(config.CHAR_ARBOR, ARBOR_BASE)

    am.link_ensemble()
    am.renormalize_objects()

    cameras = setup_scene6_cameras()
    if "WIDE" in cameras: bpy.context.scene.camera = cameras["WIDE"]

    dv6 = director_v6.SylvanDirector()
    dv6.position_protagonists()
    dv6.compose_ensemble()

    # Initialize camera rig and paths
    camera_rig_v6.setup_camera_rig_v6()

    bpy.context.view_layer.update()
    print(f"SUCCESS: Scene 6 assembled in {time.time() - start_t:.2f}s")

if __name__ == "__main__":
    generate_full_scene_v6()

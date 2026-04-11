"""
Scene 6 Generator
=================
v5 foundation (identical camera + backdrop setup) plus Sylvan Ensemble
imported from the production blend file.
"""

import bpy
import math
import mathutils
import os
import sys
import time

# Ensure v5 and v6 modules are in path
V6_DIR    = os.path.dirname(os.path.abspath(__file__))
V5_DIR    = os.path.join(os.path.dirname(V6_DIR), "5")
MOVIE_DIR = os.path.dirname(V6_DIR)

for p in (V6_DIR, V5_DIR, MOVIE_DIR):
    if p not in sys.path:
        sys.path.insert(0, p)

import config as config6
from chroma_green_setup import setup_chroma_green_backdrop

# v5 character creation (same working protagonist pipeline)
from assets_v5.plant_humanoid_v5 import create_plant_humanoid_v5, setup_production_lighting

# v6 spirit ensemble import
from asset_manager_v6 import SylvanEnsembleManager


# ---------------------------------------------------------------------------
# EXACT v5 COORDINATE CONSTANTS
# ---------------------------------------------------------------------------

HERB_BASE       = (-1.75, -0.3, 0.0)
ARBOR_BASE      = ( 1.75,  0.3, 0.0)
HERB_EYE_LEVEL  = (-1.75, -0.3, 2.5)
ARBOR_EYE_LEVEL = ( 1.75,  0.3, 2.5)

CAM_WIDE_LOC        = (0.0, -8.0, 2.0)
CAM_WIDE_ROT        = (math.radians(90), 0.0, 0.0)

CAM_HERB_OTS_START  = ( 13.5,  11.0, 6.0)
CAM_HERB_OTS_END    = ( 13.8,  11.2, 6.1)
CAM_ARBOR_OTS_START = (-13.5, -11.0, 6.0)
CAM_ARBOR_OTS_END   = (-13.8, -11.2, 6.1)
CAM_STATIC_1_POS    = ( 13.5,  11.0, 6.0)
CAM_STATIC_2_POS    = (-13.5, -11.0, 6.0)


# ---------------------------------------------------------------------------
# SCENE PURGE  (identical to v5 scorched-earth)
# ---------------------------------------------------------------------------

def _purge_scene():
    print("PURGE: Removing all persistent data blocks...")
    for coll in list(bpy.data.collections):
        for obj in list(coll.objects):
            coll.objects.unlink(obj)

    for block in [bpy.data.objects, bpy.data.meshes, bpy.data.cameras,
                  bpy.data.lights, bpy.data.materials, bpy.data.armatures,
                  bpy.data.actions, bpy.data.worlds, bpy.data.curves]:
        for item in list(block):
            try:
                block.remove(item, do_unlink=True)
            except Exception as e:
                print(f"PURGE WARNING: Could not remove {item.name}: {e}")

    print(f"PURGE: Objects remaining: {[o.name for o in bpy.data.objects]}")


# ---------------------------------------------------------------------------
# CAMERAS  (identical to v5 setup_scene5_cameras)
# ---------------------------------------------------------------------------

def _setup_cameras():
    """Exact v5 camera rig — no path constraints, no follow-path complexity."""
    scene = bpy.context.scene

    # 1. WIDE master
    cam_wide_data = bpy.data.cameras.new("WIDE")
    cam_wide_data.lens = 35
    cam_wide_data.clip_end = 1000.0
    obj_wide = bpy.data.objects.new("WIDE", cam_wide_data)
    scene.collection.objects.link(obj_wide)
    obj_wide.location      = CAM_WIDE_LOC
    obj_wide.rotation_euler = CAM_WIDE_ROT
    scene.camera = obj_wide

    # 2. OTS1 — focuses on Herbaceous
    cam_h = bpy.data.cameras.new("OTS1")
    cam_h.lens = 50
    obj_h = bpy.data.objects.new("OTS1", cam_h)
    scene.collection.objects.link(obj_h)
    obj_h.location = mathutils.Vector(CAM_HERB_OTS_START)
    vec_h = mathutils.Vector(HERB_EYE_LEVEL) - mathutils.Vector(CAM_HERB_OTS_START)
    obj_h.rotation_euler = vec_h.to_track_quat('-Z', 'Y').to_euler()
    obj_h.keyframe_insert(data_path="location", frame=1)
    obj_h.location = mathutils.Vector(CAM_HERB_OTS_END)
    obj_h.keyframe_insert(data_path="location", frame=config6.TOTAL_FRAMES)

    # 3. OTS2 — focuses on Arbor
    cam_a = bpy.data.cameras.new("OTS2")
    cam_a.lens = 50
    obj_a = bpy.data.objects.new("OTS2", cam_a)
    scene.collection.objects.link(obj_a)
    obj_a.location = mathutils.Vector(CAM_ARBOR_OTS_START)
    vec_a = mathutils.Vector(ARBOR_EYE_LEVEL) - mathutils.Vector(CAM_ARBOR_OTS_START)
    obj_a.rotation_euler = vec_a.to_track_quat('-Z', 'Y').to_euler()
    obj_a.keyframe_insert(data_path="location", frame=1)
    obj_a.location = mathutils.Vector(CAM_ARBOR_OTS_END)
    obj_a.keyframe_insert(data_path="location", frame=config6.TOTAL_FRAMES)

    # 4. Static cameras
    for name, pos, target in (
        ("OTS_Static_1", CAM_STATIC_1_POS, HERB_EYE_LEVEL),
        ("OTS_Static_2", CAM_STATIC_2_POS, ARBOR_EYE_LEVEL),
    ):
        cam_s = bpy.data.cameras.new(name)
        cam_s.lens = 50
        obj_s = bpy.data.objects.new(name, cam_s)
        scene.collection.objects.link(obj_s)
        obj_s.location = mathutils.Vector(pos)
        vec_s = mathutils.Vector(target) - mathutils.Vector(pos)
        obj_s.rotation_euler = vec_s.to_track_quat('-Z', 'Y').to_euler()

    print(f"CAMERAS: WIDE at {CAM_WIDE_LOC}, active camera = {scene.camera.name}")
    return obj_wide


# ---------------------------------------------------------------------------
# SPIRIT ENSEMBLE  (v6 addition on top of v5 base)
# ---------------------------------------------------------------------------

def _link_spirit_ensemble():
    """Imports the Sylvan Ensemble spirits from the production blend file."""
    manager = SylvanEnsembleManager()
    manager.link_ensemble()
    manager.renormalize_objects()
    manager.repair_materials()


# ---------------------------------------------------------------------------
# MASTER ASSEMBLY
# ---------------------------------------------------------------------------

def generate_full_scene_v6():
    """
    Scene 6 = v5 (backdrop + protagonists + cameras) + Sylvan Ensemble spirits.
    No normalization, no path constraints, no collection markers.
    """
    start_t = time.time()

    # 0. Clean slate (v5 style)
    _purge_scene()
    bpy.context.scene.unit_settings.system = 'METRIC'
    bpy.context.scene.unit_settings.scale_length = 1.0

    # 1. Backdrop + World  (identical to v5)
    setup_chroma_green_backdrop()

    # 2. Protagonists  (identical to v5 — procedural, created at their positions)
    herb  = create_plant_humanoid_v5(config6.CHAR_HERBACEOUS, HERB_BASE)
    arbor = create_plant_humanoid_v5(config6.CHAR_ARBOR,      ARBOR_BASE)
    bpy.context.view_layer.update()

    # 3. Lighting  (identical to v5)
    herb_body  = bpy.data.objects.get(config6.CHAR_HERBACEOUS + "_Body")
    arbor_body = bpy.data.objects.get(config6.CHAR_ARBOR      + "_Body")
    if herb_body and arbor_body:
        setup_production_lighting([herb_body, arbor_body])

    # 4. Cameras  (identical to v5 — explicit rotation, no constraints)
    _setup_cameras()

    # 5. Sylvan Ensemble (v6 addition)
    _link_spirit_ensemble()

    bpy.context.view_layer.update()
    print(f"SUCCESS: Scene 6 assembled in {time.time() - start_t:.2f}s")


if __name__ == "__main__":
    generate_full_scene_v6()

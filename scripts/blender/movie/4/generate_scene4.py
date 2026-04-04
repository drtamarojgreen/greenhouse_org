import bpy
import math
import mathutils
import os
import sys

# Ensure movie modules are in path
MOVIE_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if MOVIE_ROOT not in sys.path:
    sys.path.append(MOVIE_ROOT)

from assets_v4.plant_humanoid_v4 import create_plant_humanoid_v4, setup_production_lighting
from chroma_green_setup import setup_chroma_green_backdrop
from dialogue_blocking import set_eyeline_alignment
import config

# --- COORDINATE CONSTANTS ---
# Character Base Locations
HERB_BASE = (-1.75, -0.3, 0.0)
ARBOR_BASE = (1.75, 0.3, 0.0)

# Focal Sweet Spots (True Head Height - Raised to 2.5)
HERB_EYE_LEVEL = (-1.75, -0.3, 2.5)
ARBOR_EYE_LEVEL = (1.75, 0.3, 2.5)

# Wide Camera Master (Balanced Full-Body Shot)
CAM_WIDE_LOC = (0.0, -8.0, 2.0) 
CAM_WIDE_ROT = (math.radians(90), 0.0, 0.0)

# OTS Camera Paths (True Over-The-Shoulder Framing - OFFSET laterally to clear shoulders)
# OTS1: Focus on Herbaceous (-1.75, -0.3, 2.5), Camera behind Arbor (+1.75, 0.3, 2.5)
CAM_HERB_OTS_START = (4.0, 3.0, 2.8) 
CAM_HERB_OTS_END = (4.2, 3.1, 2.9)

# OTS2: Focus on Arbor (+1.75, 0.3, 2.5), Camera behind Herb (-1.75, -0.3, 2.5)
CAM_ARBOR_OTS_START = (-4.0, -3.0, 2.8)
CAM_ARBOR_OTS_END = (-4.2, -3.1, 2.9)

# Static Camera Positions (Matching new offset OTS framing)
CAM_STATIC_1_POS = (4.0, 3.0, 2.8)
CAM_STATIC_2_POS = (-4.0, -3.0, 2.8)

def setup_scene4_cameras():
    """Builds a professional 3-camera cinematic rig with strategic tracking."""
    cameras = {}
    scene = bpy.context.scene
    
    print(f"CALIBRATION: Initializing {config.TOTAL_FRAMES}-frame cinematic rig...")

    # 1. STRATEGIC FOCAL POINTS
    # Fixed world-space targets for stationary dialogue
    herb_focus = bpy.data.objects.new("Focus_Herbaceous", None)
    herb_focus.location = HERB_EYE_LEVEL
    scene.collection.objects.link(herb_focus)
    
    arbor_focus = bpy.data.objects.new("Focus_Arbor", None)
    arbor_focus.location = ARBOR_EYE_LEVEL
    scene.collection.objects.link(arbor_focus)
    
    # 2. CAMERA: WIDE MASTER
    cam_wide_data = bpy.data.cameras.new("WIDE")
    cam_wide_data.lens = 35
    obj_wide = bpy.data.objects.new("WIDE", cam_wide_data)
    scene.collection.objects.link(obj_wide)
    obj_wide.location = CAM_WIDE_LOC
    obj_wide.rotation_euler = CAM_WIDE_ROT
    cameras["WIDE"] = obj_wide
    
    # 3. CAMERA: OTS1 (Herbaceous Focus - Baked Static Rotation)
    cam_herb_data = bpy.data.cameras.new("OTS1")
    cam_herb_data.lens = 50
    obj_herb = bpy.data.objects.new("OTS1", cam_herb_data)
    scene.collection.objects.link(obj_herb)
    obj_herb.location = mathutils.Vector(CAM_HERB_OTS_START)

    # Bake rotation at script build-time (no constraint / no depsgraph needed)
    herb_target_vec = mathutils.Vector(HERB_EYE_LEVEL) - mathutils.Vector(CAM_HERB_OTS_START)
    obj_herb.rotation_euler = herb_target_vec.to_track_quat('-Z', 'Y').to_euler()
    print(f"OTS1: Pos={list(obj_herb.location)}, Rot={[round(math.degrees(r),1) for r in obj_herb.rotation_euler]}")

    # Dolly Keyframes (position only — rotation is baked)
    obj_herb.keyframe_insert(data_path="location", frame=1)
    obj_herb.location = mathutils.Vector(CAM_HERB_OTS_END)
    herb_target_vec_end = mathutils.Vector(HERB_EYE_LEVEL) - mathutils.Vector(CAM_HERB_OTS_END)
    obj_herb.rotation_euler = herb_target_vec_end.to_track_quat('-Z', 'Y').to_euler()
    obj_herb.keyframe_insert(data_path="location", frame=config.TOTAL_FRAMES)
    obj_herb.keyframe_insert(data_path="rotation_euler", frame=config.TOTAL_FRAMES)
    cameras[config.CHAR_HERBACEOUS] = obj_herb

    # 4. CAMERA: OTS2 (Arbor Focus - Baked Static Rotation)
    cam_arbor_data = bpy.data.cameras.new("OTS2")
    cam_arbor_data.lens = 50
    obj_arbor = bpy.data.objects.new("OTS2", cam_arbor_data)
    scene.collection.objects.link(obj_arbor)
    obj_arbor.location = mathutils.Vector(CAM_ARBOR_OTS_START)

    # Bake rotation at script build-time
    arbor_target_vec = mathutils.Vector(ARBOR_EYE_LEVEL) - mathutils.Vector(CAM_ARBOR_OTS_START)
    obj_arbor.rotation_euler = arbor_target_vec.to_track_quat('-Z', 'Y').to_euler()
    print(f"OTS2: Pos={list(obj_arbor.location)}, Rot={[round(math.degrees(r),1) for r in obj_arbor.rotation_euler]}")

    # Dolly Keyframes
    obj_arbor.keyframe_insert(data_path="location", frame=1)
    obj_arbor.location = mathutils.Vector(CAM_ARBOR_OTS_END)
    arbor_target_vec_end = mathutils.Vector(ARBOR_EYE_LEVEL) - mathutils.Vector(CAM_ARBOR_OTS_END)
    obj_arbor.rotation_euler = arbor_target_vec_end.to_track_quat('-Z', 'Y').to_euler()
    obj_arbor.keyframe_insert(data_path="location", frame=config.TOTAL_FRAMES)
    obj_arbor.keyframe_insert(data_path="rotation_euler", frame=config.TOTAL_FRAMES)
    cameras[config.CHAR_ARBOR] = obj_arbor

    # 5a. CAMERA: OTS_Static_1 (Herbaceous - Fully Static, No Animation)
    cam_s1_data = bpy.data.cameras.new("OTS_Static_1")
    cam_s1_data.lens = 50
    obj_s1 = bpy.data.objects.new("OTS_Static_1", cam_s1_data)
    scene.collection.objects.link(obj_s1)
    obj_s1.location = mathutils.Vector(CAM_STATIC_1_POS)
    s1_vec = mathutils.Vector(HERB_EYE_LEVEL) - mathutils.Vector(CAM_STATIC_1_POS)
    obj_s1.rotation_euler = s1_vec.to_track_quat('-Z', 'Y').to_euler()
    print(f"OTS_Static_1: Pos={list(obj_s1.location)}, Rot={[round(math.degrees(r),1) for r in obj_s1.rotation_euler]}")
    cameras["OTS_STATIC_1"] = obj_s1

    # 5b. CAMERA: OTS_Static_2 (Arbor - Fully Static, No Animation)
    cam_s2_data = bpy.data.cameras.new("OTS_Static_2")
    cam_s2_data.lens = 50
    obj_s2 = bpy.data.objects.new("OTS_Static_2", cam_s2_data)
    scene.collection.objects.link(obj_s2)
    obj_s2.location = mathutils.Vector(CAM_STATIC_2_POS)
    s2_vec = mathutils.Vector(ARBOR_EYE_LEVEL) - mathutils.Vector(CAM_STATIC_2_POS)
    obj_s2.rotation_euler = s2_vec.to_track_quat('-Z', 'Y').to_euler()
    print(f"OTS_Static_2: Pos={list(obj_s2.location)}, Rot={[round(math.degrees(r),1) for r in obj_s2.rotation_euler]}")
    cameras["OTS_STATIC_2"] = obj_s2

    # 6. LINEAR INTERPOLATION (OTS1/OTS2 animated cameras)
    for obj in [obj_herb, obj_arbor]:
        if not obj.animation_data:
            obj.animation_data_create()
        if obj.animation_data.action:
            action = obj.animation_data.action
            curves = getattr(action, "fcurves", None)
            if curves is None: curves = getattr(action, "curves", [])
            for fcurve in curves:
                for kp in fcurve.keyframe_points:
                    kp.interpolation = 'LINEAR'

    print(f"CALIBRATION: 3-camera rig established and focused at eye-level (Z={HERB_EYE_LEVEL[2]}).")
    return cameras


def generate_full_scene_v4():
    """Builds the Scene 4 from an absolute scorched-earth clean slate."""
    # 0. THE SCORCHED-EARTH PURGE
    # CRITICAL: Must use list() to freeze collection before iterating,
    # otherwise removing items mid-loop skips entries.
    print("PURGE: Removing all persistent data blocks...")
    for coll in list(bpy.data.collections):
        for obj in list(coll.objects):
            coll.objects.unlink(obj)

    for block in [bpy.data.objects, bpy.data.meshes, bpy.data.cameras,
                  bpy.data.lights, bpy.data.materials, bpy.data.actions, bpy.data.worlds]:
        for item in list(block):
            try:
                block.remove(item, do_unlink=True)
            except Exception as e:
                print(f"PURGE WARNING: Could not remove {item.name}: {e}")

    # Report what survived the purge (should be empty)
    surviving = [o.name for o in bpy.data.objects]
    surviving_cams = [o.name for o in bpy.data.cameras]
    print(f"PURGE: Objects remaining after purge: {surviving}")
    print(f"PURGE: Cameras remaining after purge: {surviving_cams}")
    
    # Confirm units are standard
    bpy.context.scene.unit_settings.system = 'METRIC'
    bpy.context.scene.unit_settings.scale_length = 1.0
    print(f"UNITS: Metric Scale = {bpy.context.scene.unit_settings.scale_length}")

    # 1. Environment & Backdrop
    setup_chroma_green_backdrop()
    
    # 2. Asset Generation (Humanoid V4)
    herb = create_plant_humanoid_v4(config.CHAR_HERBACEOUS, HERB_BASE)
    arbor = create_plant_humanoid_v4(config.CHAR_ARBOR, ARBOR_BASE)
    
    # Update for initial matrix evaluation
    bpy.context.view_layer.update()
    
    # 3. Blocking (Eyeline Alignment)
    set_eyeline_alignment(herb, arbor)
    set_eyeline_alignment(arbor, herb)
    
    # 4. Cinematic Lighting Rig
    herb_body = bpy.data.objects.get(config.CHAR_HERBACEOUS + "_Body")
    arbor_body = bpy.data.objects.get(config.CHAR_ARBOR + "_Body")
    if herb_body and arbor_body:
        setup_production_lighting([herb_body, arbor_body])
    
    # 5. Camera & Dolly Rig
    cameras = setup_scene4_cameras()
    bpy.context.scene.camera = cameras["WIDE"]

    # Report all cameras that exist in scene after setup
    all_cams = [o.name for o in bpy.data.objects if o.type == 'CAMERA']
    print(f"SETUP: All cameras in scene: {all_cams}")
    print(f"SETUP: Active camera is: {bpy.context.scene.camera.name} at {list(bpy.context.scene.camera.location)}")

    bpy.context.view_layer.update()
    print("Scene 4: Production-Ready V4 Assembly Complete [CLEAN SLATE].")

if __name__ == "__main__":
    generate_full_scene_v4()

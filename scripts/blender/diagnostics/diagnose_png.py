
import bpy
import os
import sys
import shutil

# Setup paths
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.append(script_dir)

import custom_animation as custom_anim
import camera_animations as cam_anim

def run_isolated_render_test(mode='TURNTABLE_ONLY', use_roi=False):
    print(f"\n{'='*50}")
    print(f"DIAGNOSTIC RENDER: {mode} (ROI: {use_roi})")
    print(f"{'='*50}")

    # Clean
    for obj in bpy.data.objects:
        bpy.data.objects.remove(obj, do_unlink=True)

    # Scene Setup
    fbx = os.path.join(script_dir, "brain.fbx")
    bpy.ops.import_scene.fbx(filepath=fbx)
    brain = bpy.context.selected_objects[0]
    brain.name = "BrainModel"
    brain.location = (0, 0, 0)

    bpy.ops.object.camera_add()
    camera = bpy.context.active_object
    camera.name = "SceneCamera"
    bpy.context.scene.camera = camera

    DATA_DIR = os.path.join(script_dir, '..', 'python')
    REGION_MAP_FILE = os.path.join(DATA_DIR, "region_map.json")
    VERTICES_FILE = os.path.join(DATA_DIR, "vertices.npy")
    LABELS_FILE = os.path.join(DATA_DIR, "labels.npy")

    # Modifiers for short test
    modifiers = {
        'intro_duration': 30,
        'dwell_duration': 15,
        'transition_duration': 15,
        'zoom_factor': 0.7,
        'neon_color': (0.1, 1.0, 1.0)
    }

    labels = ["Field CA1"] if use_roi else []
    duration = custom_anim.create_brain_tour_animation(
        labels, DATA_DIR, REGION_MAP_FILE, LABELS_FILE, VERTICES_FILE, modifiers=modifiers
    )

    # Render Settings: PNG TO ELIMINATE CODEC ISSUES
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.render.image_settings.file_format = 'PNG'

    diag_dir = os.path.join(script_dir, "diag_frames", mode)
    if os.path.exists(diag_dir):
        shutil.rmtree(diag_dir)
    os.makedirs(diag_dir, exist_ok=True)
    scene.render.filepath = os.path.join(diag_dir, "frame_")

    scene.frame_start = 1
    scene.frame_end = duration

    print(f"Starting render from 1 to {duration}...")
    try:
        bpy.ops.render.render(animation=True)
        print(f"SUCCESS: {mode} finished frames 1-{duration}")
    except Exception as e:
        print(f"FAILURE: {mode} crashed: {e}")

if __name__ == "__main__":
    # Test 1: Just the turntable to PNG
    run_isolated_render_test(mode='TURNTABLE_PNG', use_roi=False)

    # Test 2: Turntable + ROI to PNG
    run_isolated_render_test(mode='ROI_PNG', use_roi=True)

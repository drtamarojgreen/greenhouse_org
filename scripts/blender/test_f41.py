
import bpy
import os
import sys

# Add script dir to path
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.append(script_dir)

import custom_animation as custom_anim
import neuron_physics
import camera_animations

def test_range():
    print("\n--- Targeted Range Render Diagnostic (40-45) ---")
    
    # Setup
    for obj in bpy.data.objects:
        bpy.data.objects.remove(obj, do_unlink=True)
        
    fbx = os.path.join(script_dir, "brain.fbx")
    bpy.ops.import_scene.fbx(filepath=fbx)
    brain = bpy.context.selected_objects[0]
    brain.name = "BrainModel"
    
    bpy.ops.object.camera_add()
    camera = bpy.context.active_object
    camera.name = "SceneCamera"
    
    DATA_DIR = os.path.join(script_dir, '..', 'python')
    REGION_MAP_FILE = os.path.join(DATA_DIR, "region_map.json")
    VERTICES_FILE = os.path.join(DATA_DIR, "vertices.npy")
    LABELS_FILE = os.path.join(DATA_DIR, "labels.npy")
    
    # No neurons for this test
    
    short_modifiers = {
        'intro_duration': 30,
        'dwell_duration': 15,
        'transition_duration': 15,
        'zoom_factor': 0.7,
        'neon_color': (0.1, 1.0, 1.0)
    }
    
    custom_anim.create_brain_tour_animation(
        ["Field CA1"], DATA_DIR, REGION_MAP_FILE, LABELS_FILE, VERTICES_FILE,
        modifiers=short_modifiers
    )
    
    # Render just frame 41
    print("Rendering frame 41...")
    bpy.context.scene.render.engine = 'BLENDER_WORKBENCH'
    bpy.context.scene.frame_start = 41
    bpy.context.scene.frame_end = 41
    bpy.context.scene.render.filepath = "/tmp/test_f41.png"
    
    try:
        bpy.ops.render.render(write_still=True)
        print("Success: Frame 41 rendered!")
    except Exception as e:
        print(f"FAILURE: Frame 41 crashed: {e}")

if __name__ == "__main__":
    test_range()

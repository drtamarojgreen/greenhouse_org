
import bpy
import os
import sys

# Setup paths
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.append(script_dir)

import custom_animation as custom_anim

def run_material_diag():
    print("\n--- Material vs Geometry Diagnostic ---")
    
    # Clean
    for obj in bpy.data.objects:
        bpy.data.objects.remove(obj, do_unlink=True)
        
    fbx = os.path.join(script_dir, "brain.fbx")
    bpy.ops.import_scene.fbx(filepath=fbx)
    brain = bpy.context.selected_objects[0]
    brain.name = "BrainModel"
    
    bpy.ops.object.camera_add(location=(0, -12, 2))
    camera = bpy.context.active_object
    camera.name = "SceneCamera"
    bpy.context.scene.camera = camera
    
    DATA_DIR = os.path.join(script_dir, '..', 'python')
    REGION_MAP_FILE = os.path.join(DATA_DIR, "region_map.json")
    VERTICES_FILE = os.path.join(DATA_DIR, "vertices.npy")
    LABELS_FILE = os.path.join(DATA_DIR, "labels.npy")

    modifiers = {
        'intro_duration': 30,
        'dwell_duration': 15,
        'transition_duration': 15,
        'zoom_factor': 0.7,
        'neon_color': (1.0, 0.0, 0.0) # Red for test
    }

    # IMPORTANT: We override the material application inside the test
    # by monkey-patching or just modifying the script for this run.
    # Actually, I'll just manually run the ROI creation here.

    duration = custom_anim.create_brain_tour_animation(
        ["Field CA1"], DATA_DIR, REGION_MAP_FILE, LABELS_FILE, VERTICES_FILE, modifiers=modifiers
    )

    # REPLACEMENT: Apply a dead-simple material to the ROI
    for obj in bpy.data.objects:
        if obj.name.startswith("Highlight"):
            mat = bpy.data.materials.new(name="SimpleTestMat")
            mat.use_nodes = False
            mat.diffuse_color = (1, 0, 0, 1)
            obj.data.materials.clear()
            obj.data.materials.append(mat)
            print(f"Applied SIMPLE material to {obj.name}")

    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.frame_start = 40
    scene.frame_end = 40
    scene.render.filepath = "/tmp/test_simple.png"
    
    print("Rendering frame 40 with SIMPLE material...")
    try:
        bpy.ops.render.render(write_still=True)
        print("SUCCESS: Frame 40 rendered with simple material!")
    except Exception as e:
        print(f"FAILURE: Frame 40 crashed anyway: {e}")

if __name__ == "__main__":
    run_material_diag()

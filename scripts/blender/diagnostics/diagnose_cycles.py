
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

def check_cycles():
    print("\n--- Dependency Graph Cycle Diagnostic ---")
    
    # Setup full scene
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
    
    # Run the full setup from Plan 01
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
    
    print("Checking Depsgraph for cycles...")
    depsgraph = bpy.context.evaluated_depsgraph_get()
    
    # Check for cycles in the blender console output
    # (Cycles are printed to stderr/stdout by Blender itself when evaluated)
    
    # 2. Manual check of dependencies
    for obj in bpy.data.objects:
        if obj.parent:
            print(f"Parent Link: {obj.name} -> {obj.parent.name}")
        for con in obj.constraints:
            if hasattr(con, 'target') and con.target:
                print(f"Constraint Link: {obj.name} --({con.type})--> {con.target.name}")
                
    # Evaluate at frame 40
    print("\nEvaluating at Frame 40...")
    bpy.context.scene.frame_set(40)
    eval_camera = camera.evaluated_get(depsgraph)
    print(f"Evaluated Camera Loc: {eval_camera.matrix_world.to_translation()}")
    
    print("\nDiagnostic complete.")

if __name__ == "__main__":
    check_cycles()

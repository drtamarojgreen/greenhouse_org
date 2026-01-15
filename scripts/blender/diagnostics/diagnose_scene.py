
import bpy
import os
import sys

# Add script dir to path
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.append(script_dir)

import camera_animations as cam_anim
import visual_effects as vfx
import custom_animation as custom_anim
import neuron_physics

def run_diagnostic():
    print("\n" + "="*50)
    print("BLENDER SCENE DIAGNOSTIC")
    print("="*50)
    
    # Setup the scene exactly as it would be before render
    base_fbx_path = os.path.join(script_dir, "brain.fbx")
    
    # 1. Clean and Setup
    for obj in bpy.data.objects:
        bpy.data.objects.remove(obj, do_unlink=True)
    
    print(f"Importing {base_fbx_path}...")
    bpy.ops.import_scene.fbx(filepath=base_fbx_path)
    model = bpy.context.selected_objects[0]
    model.name = "BrainModel"
    model.location = (0, 0, 0)
    
    bpy.ops.object.camera_add(location=(0, -12, 2))
    camera = bpy.context.active_object
    camera.name = "SceneCamera"
    bpy.context.scene.camera = camera
    
    # 2. Add neurons and animation
    neuron_physics.create_neuron_cloud(count=10, radius=2.0)
    
    DATA_DIR = os.path.join(script_dir, '..', 'python')
    REGION_MAP_FILE = os.path.join(DATA_DIR, "region_map.json")
    VERTICES_FILE = os.path.join(DATA_DIR, "vertices.npy")
    LABELS_FILE = os.path.join(DATA_DIR, "labels.npy")
    
    labels = ["Field CA1", "Midbrain"] # Test with fewer regions
    duration = custom_anim.create_brain_tour_animation(labels, DATA_DIR, REGION_MAP_FILE, LABELS_FILE, VERTICES_FILE)
    
    print(f"\nAnimation setup complete. Total frames: {duration}")
    
    # 3. Analyze at critical frames
    test_frames = [1, 150, 151]
    for frame in test_frames:
        bpy.context.scene.frame_set(frame)
        print(f"\n--- STATE AT FRAME {frame} ---")
        
        # Camera Analysis
        cam_world_loc = camera.matrix_world.to_translation()
        print(f"Camera World Loc: {cam_world_loc}")
        print(f"Camera Parent: {camera.parent}")
        
        if camera.parent:
            print(f"Camera Local Loc: {camera.location}")
            
        # Check for NaN/Inf
        if any(not (float('-inf') < x < float('inf')) for x in cam_world_loc):
            print("CRITICAL: Camera location contains NaN/Inf!")

        # Constraints
        for c in camera.constraints:
            print(f"Constraint: {c.type} | Target: {c.target} | Influence: {c.influence}")
            
        # ROI Analysis
        for obj in bpy.data.objects:
            if obj.name.startswith("Highlight"):
                print(f"ROI '{obj.name}' | Render Hidden: {obj.hide_render} | World Loc: {obj.matrix_world.to_translation()}")
                if not obj.hide_render and frame == 151:
                    print(f"  Materials: {[m.name for m in obj.data.materials if m]}")
                    print(f"  Modifiers: {[m.type for m in obj.modifiers]}")

    print("\nDiagnostic finished.")

if __name__ == "__main__":
    run_diagnostic()

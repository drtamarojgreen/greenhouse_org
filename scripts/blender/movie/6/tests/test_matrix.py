import bpy
import os
import math

def render_texture_matrix():
    print("DIRECTOR: Visual audit with forced camera framing...")
    output_dir = "/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/movie/6/renders/matrix"
    os.makedirs(output_dir, exist_ok=True)
    
    assets_dir = "/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/movie/6/assets"
    fbx_files = [f for f in os.listdir(assets_dir) if f.endswith(".fbx")]
    
    for fbx in fbx_files:
        # 1. Reset Scene
        bpy.ops.wm.read_factory_settings(use_empty=True)
        
        # 2. Setup Camera
        bpy.ops.object.camera_add(location=(0, -10, 2))
        cam = bpy.context.active_object
        cam.rotation_euler = (math.radians(80), 0, 0)
        bpy.context.scene.camera = cam
        
        # Add spotlight parented to camera
        bpy.ops.object.light_add(type='SPOT', location=(0, 0, 0))
        spot = bpy.context.active_object
        spot.parent = cam
        spot.data.energy = 1000.0
        spot.data.spot_size = math.radians(60)
        
        # 3. Import
        print(f"DEBUG: Processing {fbx}...")
        bpy.ops.import_scene.fbx(filepath=os.path.join(assets_dir, fbx))
        
        rig = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
        if not rig:
            continue
            
        # Force framing: center camera on the imported asset
        bpy.context.view_layer.objects.active = cam
        rig.select_set(True)
        # Use simple constraint to track object if frame-fit fails
        track = cam.constraints.new(type='TRACK_TO')
        track.target = rig
        track.track_axis = 'TRACK_NEGATIVE_Z'
        track.up_axis = 'UP_Y'
        
        # Render Original
        frame_path_orig = os.path.join(output_dir, f"{fbx[:-4]}_original_pose.png")
        bpy.context.scene.render.filepath = frame_path_orig
        bpy.ops.render.render(write_still=True)
        
        # Apply Pose
        bpy.context.view_layer.objects.active = rig
        bpy.ops.object.mode_set(mode='POSE')
        root_bone = next((b for b in rig.pose.bones if b.parent is None), None)
        if root_bone:
            root_bone.rotation_euler = (0, 0, math.radians(45))
        bpy.ops.object.mode_set(mode='OBJECT')
        bpy.context.view_layer.update()
        
        # Render Rigged Pose
        frame_path_posed = os.path.join(output_dir, f"{fbx[:-4]}_rig_pose.png")
        bpy.context.scene.render.filepath = frame_path_posed
        bpy.ops.render.render(write_still=True)
        
        print(f"  - Saved: {frame_path_orig} & {frame_path_posed}")
        
        # Cleanup
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.delete()

if __name__ == "__main__":
    render_texture_matrix()

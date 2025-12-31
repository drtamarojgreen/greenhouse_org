
import bpy
import os
import sys

def run_incremental_test():
    """
    Incrementally tests Blender rendering to isolate crashes.
    STEP 1: Render a default cube with a 2-frame animation.
    """
    print("--- Starting incremental_test.py (Step 1) ---")

    try:
        # --- 1. Scene Setup (Default Cube) ---
        print("Cleaning scene...")
        if bpy.context.object and bpy.context.object.mode == 'EDIT':
            bpy.ops.object.mode_set(mode='OBJECT')
        bpy.ops.object.select_all(action='SELECT')
        bpy.ops.object.delete()
        
        print("Adding default cube...")
        bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 0))
        cube = bpy.context.active_object
        print("Default cube added.")

        # --- 2. Basic Camera and Light ---
        print("Creating camera...")
        bpy.ops.object.camera_add(location=(0, -8, 3))
        camera = bpy.context.active_object
        bpy.context.scene.camera = camera
        # Make camera look at the cube
        track_to = camera.constraints.new(type='TRACK_TO')
        track_to.target = cube
        track_to.track_axis = 'TRACK_NEGATIVE_Z'
        track_to.up_axis = 'UP_Y'
        print("Camera created and tracking cube.")

        print("Creating light...")
        bpy.ops.object.light_add(type='SUN', location=(5, 5, 10))
        print("Light created.")

        # --- 3. Animation (Simple 2-frame rotation) ---
        print("Setting up simple animation...")
        bpy.context.scene.frame_start = 1
        bpy.context.scene.frame_end = 2
        
        cube.rotation_euler = (0, 0, 0)
        cube.keyframe_insert(data_path="rotation_euler", frame=1)
        cube.rotation_euler = (0, 0, 0.1) # a very small rotation
        cube.keyframe_insert(data_path="rotation_euler", frame=2)
        print("Simple animation set up.")
        
        # --- 4. Render Settings ---
        print("Configuring render settings...")
        scene = bpy.context.scene
        scene.render.engine = 'BLENDER_EEVEE_NEXT'
        scene.render.resolution_x = 512
        scene.render.resolution_y = 512
        
        script_dir = os.path.dirname(os.path.abspath(__file__))
        render_dir = os.path.join(script_dir, "renders")
        if not os.path.exists(render_dir):
            os.makedirs(render_dir)
        scene.render.filepath = os.path.join(render_dir, "incremental_test_step1.mkv")
        scene.render.image_settings.file_format = 'FFMPEG'
        scene.render.ffmpeg.format = "MKV"
        scene.render.ffmpeg.codec = "H264"
        scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
        print("Render settings configured.")

        # --- 5. Render ---
        print("Calling bpy.ops.render.render(animation=True)...")
        bpy.ops.render.render(animation=True)
        print("bpy.ops.render.render(animation=True) call completed.")

        print("--- incremental_test.py (Step 1) finished successfully ---")

    except Exception as e:
        print(f"An error occurred: {e}")
        # Force a non-zero exit code on error
        sys.exit(1)

if __name__ == "__main__":
    run_incremental_test()

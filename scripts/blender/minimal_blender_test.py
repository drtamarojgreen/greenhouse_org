
import bpy
import os
import sys
import gc # Import garbage collection module

print("--- Starting minimal_blender_test.py (JPG render test) ---")

try:
    # --- 1. Scene Setup ---
    print("Cleaning scene...")
    if bpy.context.object and bpy.context.object.mode == 'EDIT':
        bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    print("Scene cleaned.")
    
    print("Adding default cube...")
    bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 0))
    print("Default cube added.")

    # --- 2. Basic Camera and Light ---
    print("Creating camera...")
    bpy.ops.object.camera_add(location=(0, -8, 3))
    camera = bpy.context.active_object
    bpy.context.scene.camera = camera
    print("Camera created.")

    print("Creating light...")
    bpy.ops.object.light_add(type='SUN', location=(5, 5, 10))
    print("Light created.")

    # --- 3. Render Settings (JPG output) ---
    print("Configuring render settings for JPG...")
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT' # Use the corrected engine name
    scene.render.resolution_x = 512
    scene.render.resolution_y = 512
    scene.frame_start = 1
    scene.frame_end = 1
    
    script_dir = os.path.dirname(os.path.abspath(__file__))
    render_dir = os.path.join(script_dir, "renders")
    if not os.path.exists(render_dir):
        os.makedirs(render_dir)
    scene.render.filepath = os.path.join(render_dir, "minimal_test_render.jpg")
    scene.render.image_settings.file_format = 'JPEG'
    scene.render.image_settings.quality = 90
    print("Render settings configured for JPG.")

    # --- 4. Render ---
    print("Performing garbage collection before rendering...")
    gc.collect() # Explicit garbage collection
    print("Calling bpy.ops.render.render(write_still=True)...")
    bpy.ops.render.render(write_still=True)
    print("bpy.ops.render.render() call completed.")

    print("--- minimal_blender_test.py (JPG render test) finished successfully ---")

except Exception as e:
    print(f"An error occurred: {e}")
    sys.exit(1)

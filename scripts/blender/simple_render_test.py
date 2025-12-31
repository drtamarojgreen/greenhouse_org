
import bpy
import os

print("--- Starting simple_render_test.py ---")

try:
    # --- Basic Scene Setup ---
    print("Cleaning scene...")
    if bpy.context.object and bpy.context.object.mode == 'EDIT':
        bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    print("Scene cleaned.")

    # --- Load FBX ---
    script_dir = os.path.dirname(os.path.abspath(__file__))
    fbx_path = os.path.join(script_dir, "brain.fbx")
    print(f"Attempting to import FBX: {fbx_path}")
    if not os.path.exists(fbx_path):
        print("CRITICAL: brain.fbx not found!")
    else:
        bpy.ops.import_scene.fbx(filepath=fbx_path)
        print("FBX import call completed.")

    # --- Basic Camera and Light ---
    print("Creating camera...")
    bpy.ops.object.camera_add(location=(0, -10, 5))
    camera = bpy.context.active_object
    bpy.context.scene.camera = camera
    print("Camera created.")

    print("Creating light...")
    bpy.ops.object.light_add(type='SUN', location=(5, 5, 10))
    print("Light created.")

    # --- Render Settings ---
    print("Configuring render settings...")
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 768
    scene.frame_start = 1
    scene.frame_end = 1
    
    render_dir = os.path.join(script_dir, "renders")
    if not os.path.exists(render_dir):
        os.makedirs(render_dir)
    scene.render.filepath = os.path.join(render_dir, "simple_test_render.png")
    scene.render.image_settings.file_format = 'PNG'
    print("Render settings configured.")

    # --- Render ---
    print("Calling bpy.ops.render.render()...")
    bpy.ops.render.render(write_still=True)
    print("bpy.ops.render.render() call completed.")

    print("--- simple_render_test.py finished successfully ---")

except Exception as e:
    print(f"An error occurred: {e}")
    # Force a non-zero exit code on error
    import sys
    sys.exit(1)

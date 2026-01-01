import bpy
import os
import math

# --- Minimal Render Test ---
# This script creates a very simple scene to verify core rendering functionality.

# 1. CLEAN SCENE
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# 2. ADD A CUBE
bpy.ops.mesh.primitive_cube_add(location=(0, 0, 0))

# 3. ADD A CAMERA AND LIGHT
bpy.ops.object.camera_add(location=(5, -5, 5), rotation=(math.radians(60), 0, math.radians(45)))
bpy.context.scene.camera = bpy.context.object

bpy.ops.object.light_add(type='SUN', location=(10, 10, 10))

# 4. RENDER SETTINGS
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
bpy.context.scene.cycles.use_denoising = False
scene.render.image_settings.file_format = 'PNG'
scene.render.resolution_x = 512
scene.render.resolution_y = 512

# 5. OUTPUT PATH
script_dir = os.path.dirname(os.path.abspath(__file__))
output_dir = os.path.join(script_dir, "render_outputs", "minimal_test")
os.makedirs(output_dir, exist_ok=True)
scene.render.filepath = os.path.join(output_dir, "test_cube.png")

# 6. RENDER
bpy.ops.render.render(write_still=True)

print("Minimal render test complete. Output should be at:", scene.render.filepath)

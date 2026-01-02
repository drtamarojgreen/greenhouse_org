import bpy
import math

# Clean scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# Background color (bright red for high contrast)
bpy.context.scene.world.use_nodes = True
bg_nodes = bpy.context.scene.world.node_tree.nodes
bg_nodes["Background"].inputs[0].default_value = (1, 0, 0, 1) # Red

# Create material (bright green)
mat_text = bpy.data.materials.new("DebugGreen")
mat_text.use_nodes = True
bsdf = mat_text.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0, 1, 0, 1) # Green

# Create text object
bpy.ops.object.text_add(location=(0, 0, 0))
obj = bpy.context.object
obj.name = "DebugText"
obj.data.body = "DEBUG"
obj.data.extrude = 0.1
obj.scale = (2, 2, 2)
obj.data.align_x = 'CENTER'
obj.data.align_y = 'CENTER'
obj.data.materials.append(mat_text)

# --- CORRECTED CAMERA SETUP ---
# Place camera at (0, -10, 0)
# Rotate it 90 degrees on the X-axis to point it towards the origin (0, 0, 0)
bpy.ops.object.camera_add(location=(0, -10, 0), rotation=(math.radians(90), 0, 0))
camera = bpy.context.object
bpy.context.scene.camera = camera

# Render settings
scene = bpy.context.scene
scene.render.filepath = '/app/debug_render_output.png'
scene.render.image_settings.file_format = 'PNG'
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080

# Render
bpy.ops.render.render(write_still=True)

print("Debug render complete.")

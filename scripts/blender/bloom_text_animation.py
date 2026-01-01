import bpy
import math

# -----------------------------
# Scene Reset
# -----------------------------
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end = 180
scene.render.fps = 30

# -----------------------------
# Render Settings
# -----------------------------
scene.render.engine = 'CYCLES'
scene.cycles.samples = 128
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.filepath = "//bloom_into_your_better_self.mp4"
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format = 'MPEG4'
scene.render.ffmpeg.codec = 'H264'

# -----------------------------
# Create Text Object
# -----------------------------
bpy.ops.object.text_add(location=(0, 0, 0))
text_obj = bpy.context.object
text_obj.data.body = "Bloom Into\nYour Better Self"

text_obj.data.align_x = 'CENTER'
text_obj.data.align_y = 'CENTER'
text_obj.data.space_line = 1.3

# Block letter geometry
text_obj.data.extrude = 0.25
text_obj.data.bevel_depth = 0.03
text_obj.data.bevel_resolution = 3

# Convert to mesh for animation robustness
bpy.ops.object.convert(target='MESH')

# -----------------------------
# Material
# -----------------------------
mat = bpy.data.materials.new(name="BloomGreen")
mat.use_nodes = True
nodes = mat.node_tree.nodes
bsdf = nodes.get("Principled BSDF")

bsdf.inputs["Base Color"].default_value = (0.25, 0.55, 0.35, 1)
bsdf.inputs["Roughness"].default_value = 0.4
bsdf.inputs["Specular IOR Level"].default_value = 0.5 # Replaces "Specular" in Blender 4.0+

text_obj.data.materials.append(mat)

# -----------------------------
# Scale & Animate (Bloom Effect)
# -----------------------------
text_obj.scale = (0.01, 0.01, 0.01)
text_obj.keyframe_insert(data_path="scale", frame=1)

text_obj.scale = (1.0, 1.0, 1.0)
text_obj.keyframe_insert(data_path="scale", frame=60)

# Ease-out motion
for fcurve in text_obj.animation_data.action.fcurves:
    for kp in fcurve.keyframe_points:
        kp.interpolation = 'BEZIER'

# -----------------------------
# Subtle Float Animation
# -----------------------------
text_obj.location = (0, 0, 0)
text_obj.keyframe_insert(data_path="location", frame=60)

text_obj.location = (0, 0, 0.2)
text_obj.keyframe_insert(data_path="location", frame=180)

# -----------------------------
# Camera
# -----------------------------
bpy.ops.object.camera_add(location=(0, -10, 2))
camera = bpy.context.object
camera.rotation_euler = (
    math.radians(80),
    0,
    0
)
scene.camera = camera

# -----------------------------
# Lighting
# -----------------------------
# Key Light
bpy.ops.object.light_add(type='AREA', location=(3, -3, 4))
key_light = bpy.context.object
key_light.data.energy = 800
key_light.data.size = 4

# Fill Light
bpy.ops.object.light_add(type='AREA', location=(-3, -4, 2))
fill_light = bpy.context.object
fill_light.data.energy = 300
fill_light.data.size = 3

# Back Light
bpy.ops.object.light_add(type='POINT', location=(0, 3, 3))
back_light = bpy.context.object
back_light.data.energy = 200

# -----------------------------
# Ground Plane
# -----------------------------
bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, -1))
plane = bpy.context.object

plane_mat = bpy.data.materials.new(name="Ground")
plane_mat.use_nodes = True
plane_nodes = plane_mat.node_tree.nodes
plane_bsdf = plane_nodes.get("Principled BSDF")
plane_bsdf.inputs["Base Color"].default_value = (0.05, 0.05, 0.05, 1)
plane_bsdf.inputs["Roughness"].default_value = 0.9

plane.data.materials.append(plane_mat)

# -----------------------------
import sys
import argparse

# --- Main Execution ---
if __name__ == "__main__":
    # Get arguments after '--'
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []

    # Set up argument parser
    parser = argparse.ArgumentParser(description="Generate and render a blooming text animation.")
    parser.add_argument("--output-video", default="//bloom_into_your_better_self.mp4", help="Path for the output video file.")
    parser.add_argument("--save-blend", help="Path to save the generated .blend file (optional).")

    args = parser.parse_args(argv)

    # Update the render path
    scene.render.filepath = args.output_video

    # Save the .blend file if a path is provided
    if args.save_blend:
        bpy.ops.wm.save_as_mainfile(filepath=args.save_blend)
        print(f"Saved .blend file to: {args.save_blend}")

    # Optional: Render Animation (can be triggered from a test or another script)
    print("Starting animation render...")
    bpy.ops.render.render(animation=True)
    print("Render complete.")

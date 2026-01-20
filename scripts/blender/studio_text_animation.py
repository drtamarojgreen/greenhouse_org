import bpy
import math

# -------------------------------------------------
# Scene Reset
# -------------------------------------------------
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end = 240
scene.render.fps = 30

# -------------------------------------------------
# Render Settings
# -------------------------------------------------
scene.render.engine = 'CYCLES'
scene.cycles.samples = 128
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.filepath = "//greenhousemhd_studios.mp4"
scene.render.image_settings.file_format = 'FFMPEG'
scene.render.ffmpeg.format = 'MPEG4'
scene.render.ffmpeg.codec = 'H264'

# -------------------------------------------------
# Create Text Object
# -------------------------------------------------
bpy.ops.object.text_add(location=(0, 0, 0), rotation=(math.radians(90), 0, 0))
text_obj = bpy.context.object
text_obj.data.body = "GreenhouseMHD Studios"

text_obj.data.align_x = 'CENTER'
text_obj.data.align_y = 'CENTER'
text_obj.data.extrude = 0.3
text_obj.data.bevel_depth = 0.04
text_obj.data.bevel_resolution = 4
text_obj.data.space_character = 1.1

# -------------------------------------------------
# Convert to Mesh
# -------------------------------------------------
bpy.ops.object.convert(target='MESH')

# -------------------------------------------------
# Separate Letters
# -------------------------------------------------
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.separate(type='LOOSE')
bpy.ops.object.mode_set(mode='OBJECT')

letters = [obj for obj in bpy.context.selected_objects]
letters.sort(key=lambda o: o.location.x)

# -------------------------------------------------
# Material (Studio Green)
# -------------------------------------------------
mat = bpy.data.materials.new(name="GreenhouseStudio")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.20, 0.50, 0.35, 1)
bsdf.inputs["Roughness"].default_value = 0.35
bsdf.inputs["Specular IOR Level"].default_value = 0.45 # Replaces "Specular" in Blender 4.0+

for l in letters:
    l.data.materials.append(mat)

# -------------------------------------------------
# Animate Letters
# -------------------------------------------------
start_frame = 20
frame_step = 6

for i, letter in enumerate(letters):
    f0 = start_frame + i * frame_step
    f1 = f0 + 20

    # Initial hidden state
    letter.scale = (0.001, 0.001, 0.001)
    letter.location.z -= 0.3
    letter.keyframe_insert(data_path="scale", frame=f0)
    letter.keyframe_insert(data_path="location", frame=f0)

    # Final visible state
    letter.scale = (1, 1, 1)
    letter.location.z += 0.3
    letter.keyframe_insert(data_path="scale", frame=f1)
    letter.keyframe_insert(data_path="location", frame=f1)

    # Ease motion
    for fcurve in letter.animation_data.action.fcurves:
        for kp in fcurve.keyframe_points:
            kp.interpolation = 'BEZIER'

# -------------------------------------------------
# Camera
# -------------------------------------------------
bpy.ops.object.camera_add(location=(0, -14, 3))
camera = bpy.context.object
camera.rotation_euler = (math.radians(78), 0, 0)
scene.camera = camera

# -------------------------------------------------
# Lighting
# -------------------------------------------------
# Key Light
bpy.ops.object.light_add(type='AREA', location=(4, -4, 5))
key = bpy.context.object
key.data.energy = 900
key.data.size = 4

# Fill Light
bpy.ops.object.light_add(type='AREA', location=(-4, -6, 3))
fill = bpy.context.object
fill.data.energy = 350
fill.data.size = 3

# Rim Light
bpy.ops.object.light_add(type='POINT', location=(0, 5, 4))
rim = bpy.context.object
rim.data.energy = 250

# -------------------------------------------------
# Ground Plane
# -------------------------------------------------
bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, -1))
plane = bpy.context.object

plane_mat = bpy.data.materials.new(name="StudioFloor")
plane_mat.use_nodes = True
pbsdf = plane_mat.node_tree.nodes["Principled BSDF"]
pbsdf.inputs["Base Color"].default_value = (0.06, 0.07, 0.06, 1)
pbsdf.inputs["Roughness"].default_value = 0.9
plane.data.materials.append(plane_mat)

# -------------------------------------------------
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
    parser = argparse.ArgumentParser(description="Generate and render a studio text animation.")
    parser.add_argument("--output-video", default="//greenhousemhd_studios.mp4", help="Path for the output video file.")
    parser.add_argument("--save-blend", help="Path to save the generated .blend file (optional).")

    args = parser.parse_args(argv)

    # Update the render path
    scene.render.filepath = args.output_video

    # Save the .blend file if a path is provided
    if args.save_blend:
        bpy.ops.wm.save_as_mainfile(filepath=args.save_blend)
        print(f"Saved .blend file to: {args.save_blend}")

    # Optional: Render Animation (can be triggered from a test or another script)
    # print("Starting animation render...")
    # bpy.ops.render.render(animation=True)
    # print("Render complete.")

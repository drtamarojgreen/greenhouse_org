import bpy
import math

# =================================================
# Scene Reset
# =================================================
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end = 300
scene.render.fps = 30

# =================================================
# Render Settings
# =================================================
scene.render.engine = 'CYCLES'
scene.cycles.samples = 128
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080

# =================================================
# Create Text Object
# =================================================
bpy.ops.object.text_add(location=(0, 0, 0))
text_obj = bpy.context.object

text_obj.data.body = (
    "The Greenhouse\n"
    "for Mental Health\n"
    "Development"
)

text_obj.data.align_x = 'CENTER'
text_obj.data.align_y = 'CENTER'
text_obj.data.space_line = 1.4
text_obj.data.space_character = 1.05

# Block letter geometry
text_obj.data.extrude = 0.35
text_obj.data.bevel_depth = 0.04
text_obj.data.bevel_resolution = 4

# =================================================
# Convert to Mesh and Separate Letters
# =================================================
bpy.ops.object.convert(target='MESH')

bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.separate(type='LOOSE')
bpy.ops.object.mode_set(mode='OBJECT')

letters = [obj for obj in bpy.context.selected_objects]
letters.sort(key=lambda o: (o.location.y, o.location.x))

# =================================================
# Material (Greenhouse Studio Green)
# =================================================
mat = bpy.data.materials.new(name="GreenhouseGreen")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]

bsdf.inputs["Base Color"].default_value = (0.22, 0.52, 0.36, 1)
bsdf.inputs["Roughness"].default_value = 0.38
bsdf.inputs["Specular IOR Level"].default_value = 0.45

for l in letters:
    l.data.materials.append(mat)

# =================================================
# Animate Letters (Reveal)
# =================================================
start_frame = 20
frame_step = 4
rise_amount = 0.4

for i, letter in enumerate(letters):
    f0 = start_frame + i * frame_step
    f1 = f0 + 24

    # Hidden state
    letter.scale = (0.001, 0.001, 0.001)
    letter.location.z -= rise_amount
    letter.keyframe_insert("scale", frame=f0)
    letter.keyframe_insert("location", frame=f0)

    # Final state
    letter.scale = (1, 1, 1)
    letter.location.z += rise_amount
    letter.keyframe_insert("scale", frame=f1)
    letter.keyframe_insert("location", frame=f1)

    for fcurve in letter.animation_data.action.fcurves:
        for kp in fcurve.keyframe_points:
            kp.interpolation = 'BEZIER'

# =================================================
# Empty Target (Camera Look-At)
# =================================================
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
target = bpy.context.object
target.name = "CameraTarget"

# =================================================
# Camera Path
# =================================================
bpy.ops.curve.primitive_bezier_circle_add(radius=14, location=(0, 0, 1.8))
cam_path = bpy.context.object
cam_path.name = "CameraPath"

# =================================================
# Camera
# =================================================
bpy.ops.object.camera_add(location=(0, -14, 2))
camera = bpy.context.object
scene.camera = camera

# Follow Path constraint
follow = camera.constraints.new(type='FOLLOW_PATH')
follow.target = cam_path
follow.use_curve_follow = True

# Animate camera around path
cam_path.data.path_duration = scene.frame_end

follow.offset_factor = 0.0
follow.keyframe_insert("offset_factor", frame=1)

follow.offset_factor = 1.0
follow.keyframe_insert("offset_factor", frame=scene.frame_end)

# Track To constraint
track = camera.constraints.new(type='TRACK_TO')
track.target = target
track.track_axis = 'TRACK_NEGATIVE_Z'
track.up_axis = 'UP_Y'

# =================================================
# Lighting
# =================================================
# Key Light
bpy.ops.object.light_add(type='AREA', location=(5, -5, 6))
key = bpy.context.object
key.data.energy = 1000
key.data.size = 4

# Fill Light
bpy.ops.object.light_add(type='AREA', location=(-5, -6, 4))
fill = bpy.context.object
fill.data.energy = 400
fill.data.size = 3

# Rim Light
bpy.ops.object.light_add(type='POINT', location=(0, 6, 5))
rim = bpy.context.object
rim.data.energy = 300

# =================================================
# Ground Plane
# =================================================
bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, -1.2))
plane = bpy.context.object

plane_mat = bpy.data.materials.new(name="Ground")
plane_mat.use_nodes = True
pbsdf = plane_mat.node_tree.nodes["Principled BSDF"]
pbsdf.inputs["Base Color"].default_value = (0.05, 0.06, 0.05, 1)
pbsdf.inputs["Roughness"].default_value = 0.9
plane.data.materials.append(plane_mat)

# =================================================
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
    parser = argparse.ArgumentParser(description="Generate and render a full title animation.")
    parser.add_argument("--output-video", help="Path for the output video file.")
    parser.add_argument("--save-blend", help="Path to save the generated .blend file (optional).")

    args = parser.parse_args(argv)

    # Update the render path if provided
    if args.output_video:
        scene.render.filepath = args.output_video

    # Save the .blend file if a path is provided
    if args.save_blend:
        bpy.ops.wm.save_as_mainfile(filepath=args.save_blend)
        print(f"Saved .blend file to: {args.save_blend}")

    # Optional: Render Animation if an output path is provided
    if args.output_video and not args.save_blend:
        print("Starting animation render...")
        bpy.ops.render.render(animation=True)
        print("Render complete.")

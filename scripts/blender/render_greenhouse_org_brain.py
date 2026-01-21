import bpy
import math
import os
import sys
import argparse

def setup_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = 90
    scene.render.fps = 30
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 64
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720

    return scene

def create_logo_background(logo_path):
    if not os.path.exists(logo_path):
        print(f"Warning: Logo not found at {logo_path}")
        return None

    bpy.ops.mesh.primitive_plane_add(size=15, location=(0, 5, 0), rotation=(math.radians(90), 0, 0))
    bg_plane = bpy.context.object
    mat = bpy.data.materials.new(name="LogoMaterial")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes

    # Simple setup for logo
    bsdf = nodes["Principled BSDF"]
    node_tex = nodes.new(type='ShaderNodeTexImage')
    try:
        node_tex.image = bpy.data.images.load(logo_path)
        mat.node_tree.links.new(node_tex.outputs['Color'], bsdf.inputs['Base Color'])
        mat.node_tree.links.new(node_tex.outputs['Alpha'], bsdf.inputs['Alpha'])
        mat.blend_method = 'BLEND'
    except Exception as e:
        print(f"Error loading logo: {e}")
        bsdf.inputs["Base Color"].default_value = (0.1, 0.1, 0.1, 1)

    bg_plane.data.materials.append(mat)
    return bg_plane

def create_placeholder_brain():
    print("Creating placeholder brain mesh...")
    bpy.ops.mesh.primitive_uv_sphere_add(radius=2, location=(0, 0, 0))
    brain_obj = bpy.context.object
    brain_obj.name = "PlaceholderBrain"
    brain_obj.scale = (1.2, 1.5, 1.2) # Vaguely brain-shaped

    mat = bpy.data.materials.new(name="BrainGlow")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.8, 0.7, 0.7, 1)
    bsdf.inputs["Emission Color"].default_value = (0.2, 0.6, 1.0, 1)
    bsdf.inputs["Emission Strength"].default_value = 2.0
    brain_obj.data.materials.append(mat)

    return [brain_obj]

def import_brain(fbx_path):
    if not os.path.exists(fbx_path):
        print(f"Brain FBX not found at {fbx_path}")
        return create_placeholder_brain()

    try:
        # Create a parent empty to manage the imported objects
        bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
        brain_parent = bpy.context.object
        brain_parent.name = "BrainParent"

        # Import FBX
        bpy.ops.import_scene.fbx(filepath=fbx_path)
        brain_objs = bpy.context.selected_objects

        if not brain_objs:
            return create_placeholder_brain()

        for obj in brain_objs:
            obj.parent = brain_parent

        # Animate the parent empty for rotation
        brain_parent.rotation_mode = 'XYZ'
        brain_parent.keyframe_insert(data_path="rotation_euler", frame=1)
        brain_parent.rotation_euler.z = math.radians(360)
        brain_parent.keyframe_insert(data_path="rotation_euler", frame=90)

        # Ensure materials have some glow
        for obj in brain_objs:
            if obj.type == 'MESH':
                if not obj.data.materials:
                    mat = bpy.data.materials.new(name="ImportedBrainGlow")
                    mat.use_nodes = True
                    bsdf = mat.node_tree.nodes["Principled BSDF"]
                    bsdf.inputs["Emission Color"].default_value = (0.2, 0.6, 1.0, 1)
                    bsdf.inputs["Emission Strength"].default_value = 1.0
                    obj.data.materials.append(mat)

        return brain_objs
    except Exception as e:
        print(f"Error importing FBX: {e}")
        return create_placeholder_brain()

def create_text(content, location=(0, -2, -3)):
    bpy.ops.object.text_add(location=location, rotation=(math.radians(90), 0, 0))
    text_obj = bpy.context.object
    text_obj.data.body = content
    text_obj.data.align_x = 'CENTER'
    text_obj.data.align_y = 'CENTER'
    text_obj.data.extrude = 0.1
    text_obj.data.bevel_depth = 0.02

    mat = bpy.data.materials.new(name="URLTextMaterial")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.1, 0.5, 0.3, 1)
    bsdf.inputs["Roughness"].default_value = 0.1  # Low roughness for sharp reflections
    bsdf.inputs["Metallic"].default_value = 0.7   # Higher metallic for distinct highlights
    text_obj.data.materials.append(mat)
    return text_obj

def create_moving_spotlights(scene, target_obj):
    # Create path for spotlights
    bpy.ops.curve.primitive_bezier_circle_add(radius=12, location=(0, 0, 10), rotation=(0, 0, 0))
    path = bpy.context.object
    path.name = "SpotlightPath"

    for i in range(2):
        bpy.ops.object.light_add(type='SPOT', location=(0, 0, 0))
        spot = bpy.context.object
        spot.name = f"MovingSpot_{i}"
        spot.data.energy = 4000
        spot.data.spot_size = math.radians(35)
        spot.data.spot_blend = 0.5
        
        follow = spot.constraints.new(type='FOLLOW_PATH')
        follow.target = path
        follow.offset_factor = i * 0.5
        follow.keyframe_insert(data_path="offset_factor", frame=scene.frame_start)
        follow.offset_factor = (i * 0.5) + 1.0
        follow.keyframe_insert(data_path="offset_factor", frame=scene.frame_end)
        
        track = spot.constraints.new(type='TRACK_TO')
        track.target = target_obj
        track.track_axis = 'TRACK_NEGATIVE_Z'
        track.up_axis = 'UP_Y'

def main():
    parser = argparse.ArgumentParser(description="Render greenhousemd.org animation with logo and brain")
    parser.add_argument("--output", default="//greenhouse_org_brain.mp4", help="Output path")
    parser.add_argument("--output-video", help="Output video path")
    parser.add_argument("--logo", default="docs/images/Greenhouse_Logo.png", help="Path to logo")
    parser.add_argument("--brain", default="scripts/blender/brain.fbx", help="Path to brain FBX")

    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []
    args = parser.parse_args(argv)

    scene = setup_scene()

    # Resolve absolute paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(os.path.dirname(script_dir))
    logo_path = os.path.join(root_dir, args.logo)
    brain_path = os.path.join(root_dir, args.brain)

    create_logo_background(logo_path)
    import_brain(brain_path)
    create_text("greenhousemd.org", location=(0, -2, 0))

    # Create axis for spotlights
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
    center_axis = bpy.context.object
    create_moving_spotlights(scene, center_axis)

    # Camera setup
    bpy.ops.object.camera_add(location=(0, -22, 0), rotation=(math.radians(90), 0, 0))
    scene.camera = bpy.context.object

    # Lighting setup
    bpy.ops.object.light_add(type='SUN', location=(5, -5, 5))
    bpy.ops.object.light_add(type='POINT', location=(0, 0, 5))

    # Render settings
    output_path = args.output_video if args.output_video else args.output
    output_dir = os.path.dirname(output_path)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    scene.render.filepath = output_path
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format = 'MPEG4'
    scene.render.ffmpeg.codec = 'H264'

    print(f"Rendering animation to {output_path}...")
    bpy.ops.render.render(animation=True)

if __name__ == "__main__":
    main()

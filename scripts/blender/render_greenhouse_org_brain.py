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
    scene.frame_end = 120
    scene.render.fps = 24
    scene.render.engine = 'CYCLES'
    
    # Cycles Noise Reduction Settings
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 512
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.005
    scene.cycles.use_denoising = False
    
    # Advanced Noise Clamping
    scene.cycles.blur_glossy = 1.0
    scene.cycles.sample_clamp_indirect = 1.0
    scene.cycles.caustics_reflective = False
    scene.cycles.caustics_refractive = False
    scene.cycles.max_bounces = 4
    
    for rl in scene.view_layers:
        if hasattr(rl, "cycles"):
            rl.cycles.use_denoising = False
        
    scene.render.resolution_x = 854
    scene.render.resolution_y = 480

    scene.world.use_nodes = True
    bg_node = scene.world.node_tree.nodes.get("Background")
    if bg_node:
        bg_node.inputs[0].default_value = (0.002, 0.002, 0.002, 1)

    return scene

def create_logo_background(logo_path):
    if not os.path.exists(logo_path):
        print(f"Warning: Logo not found at {logo_path}")
        return None

    # Logo at the back (Y=5)
    bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 5, 0), rotation=(math.pi / 2, 0, math.pi))
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

def import_neuron(fbx_path):
    # Neuron between Letters and Logo (Y=2.5)
    if not os.path.exists(fbx_path):
        print(f"Neuron FBX not found at {fbx_path}, creating placeholder")
        bpy.ops.mesh.primitive_uv_sphere_add(radius=2, location=(0, 2.5, 0))
        neuron_obj = bpy.context.object
    else:
        bpy.ops.import_scene.fbx(filepath=fbx_path)
        neuron_objs = bpy.context.selected_objects
        if not neuron_objs:
            bpy.ops.mesh.primitive_uv_sphere_add(radius=2, location=(0, 2.5, 0))
            neuron_obj = bpy.context.object
        else:
            neuron_obj = neuron_objs[0] # Assuming first object is the root
            neuron_obj.location = (0, 2.5, 0)
    
    # Glowy material for neuron
    mat = bpy.data.materials.new(name="NeuronGlow")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.2, 0.8, 0.4, 1)
    bsdf.inputs["Emission Color"].default_value = (0.1, 0.5, 0.2, 1)
    bsdf.inputs["Emission Strength"].default_value = 1.0
    neuron_obj.data.materials.clear()
    neuron_obj.data.materials.append(mat)
    
    return neuron_obj

def create_text(content, location=(0, 0, 0)):
    # Letters at the origin (Y=0)
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
    bsdf.inputs["Roughness"].default_value = 0.15
    bsdf.inputs["Metallic"].default_value = 1.0
    text_obj.data.materials.append(mat)
    return text_obj

def create_crossing_spotlights(scene, target_obj):
    # Positioned behind the camera (Camera at Y=-25)
    for i, start_loc in enumerate([(-15, -40, 10), (15, -40, 10)]):
        bpy.ops.object.light_add(type='SPOT', location=start_loc)
        spot = bpy.context.object
        spot.name = f"Spotlight_{i}"
        spot.data.energy = 200000
        spot.data.spot_size = math.radians(30)
        spot.data.shadow_soft_size = 1.5
        
        track = spot.constraints.new(type='TRACK_TO')
        track.target = target_obj
        track.track_axis = 'TRACK_NEGATIVE_Z'
        track.up_axis = 'UP_Y'

def main():
    parser = argparse.ArgumentParser(description="Render greenhousemd.org animation with Crossing Spotlights")
    parser.add_argument("--output", default="//greenhouse_org_brain_final.png", help="Output path")
    parser.add_argument("--output-video", help="Output video path")
    parser.add_argument("--logo", default="docs/images/Greenhouse_Logo.png", help="Path to logo")
    parser.add_argument("--neuron", default="scripts/blender/neuron.fbx", help="Path to neuron FBX")

    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []
    args = parser.parse_args(argv)

    scene = setup_scene()

    # Absolute paths
    base_dir = os.getcwd()
    logo_path = os.path.join(base_dir, args.logo)
    neuron_path = os.path.join(base_dir, args.neuron)

    create_logo_background(logo_path)
    import_neuron(neuron_path)
    create_text("greenhousemd.org")

    # Target Axis
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
    center_axis = bpy.context.object
    center_axis.name = "CenterTarget"
    create_crossing_spotlights(scene, center_axis)

    # Camera back to frame logo (Y=-25)
    bpy.ops.object.camera_add(location=(0, -25, 0), rotation=(math.radians(90), 0, 0))
    scene.camera = bpy.context.object
    scene.camera.data.lens = 20 # Fit size 30 logo at distance 30

    output_path = args.output_video if args.output_video else args.output
    output_dir = os.path.dirname(output_path)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    scene.render.filepath = output_path
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format = 'MPEG4'
    scene.render.ffmpeg.codec = 'H264'

    print(f"Rendering framed animation to {output_path}...")
    bpy.ops.render.render(animation=True)

if __name__ == "__main__":
    main()

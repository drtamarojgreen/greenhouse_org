import bpy
import math
import os
import sys
import argparse
import random

def setup_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = 120
    scene.render.fps = 24
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 128
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.01
    scene.cycles.use_denoising = False
    scene.render.resolution_x = 960
    scene.render.resolution_y = 540
    scene.world.use_nodes = True
    bg_node = scene.world.node_tree.nodes.get("Background")
    if bg_node: bg_node.inputs[0].default_value = (0.001, 0.001, 0.001, 1)
    return scene

def create_logo_background(logo_path):
    if not os.path.exists(logo_path): return None
    bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 25, 0), rotation=(math.radians(90), 0, 0))
    bg_plane = bpy.context.object
    mat = bpy.data.materials.new(name="LogoMaterial")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    node_tex = mat.node_tree.nodes.new(type='ShaderNodeTexImage')
    try:
        node_tex.image = bpy.data.images.load(logo_path)
        mat.node_tree.links.new(node_tex.outputs['Color'], bsdf.inputs['Base Color'])
    except: pass
    bg_plane.data.materials.append(mat)
    return bg_plane

def import_brain(fbx_path):
    if not os.path.exists(fbx_path):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=8, location=(0, 10, 0))
        brain = bpy.context.object
    else:
        bpy.ops.import_scene.fbx(filepath=fbx_path)
        brain = bpy.context.selected_objects[0]
        brain.location = (0, 10, 0)
        brain.scale = (4, 4, 4)
    mat = bpy.data.materials.new(name="BrainMat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.1, 0.2, 0.4, 0.2)
    bsdf.inputs["Alpha"].default_value = 0.3
    mat.blend_method = 'BLEND'
    brain.data.materials.clear()
    brain.data.materials.append(mat)
    return brain

def import_neurons(fbx_path):
    if not os.path.exists(fbx_path):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=(-1, 10, 0))
        n1 = bpy.context.object
        bpy.ops.mesh.primitive_uv_sphere_add(radius=1, location=(1, 10, 0))
        n2 = bpy.context.object
        return n1, n2
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    n1 = bpy.context.selected_objects[0]
    n1.location = (-1, 10, 0)
    n1.rotation_euler = (0, math.radians(90), 0)
    n1.scale = (0.5, 0.5, 0.5)
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    n2 = [obj for obj in bpy.context.selected_objects if obj != n1][0]
    n2.location = (1, 10, 0)
    n2.rotation_euler = (0, math.radians(-90), 0)
    n2.scale = (0.5, 0.5, 0.5)
    mat = bpy.data.materials.new(name="NeuronMat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.2, 1.0, 0.4, 1)
    bsdf.inputs["Emission Color"].default_value = (0.1, 0.8, 0.2, 2)
    for n in [n1, n2]:
        n.data.materials.clear()
        n.data.materials.append(mat)
    return n1, n2

def create_neurotransmitters():
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.02, location=(0, 10, 0))
    emitter = bpy.context.object
    bpy.ops.object.particle_system_add()
    settings = emitter.particle_systems[0].settings
    settings.count = 50
    settings.lifetime = 15
    settings.normal_factor = 3.0
    settings.effector_weights.gravity = 0.0
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.02)
    particle_obj = bpy.context.object
    p_mat = bpy.data.materials.new(name="NTMat")
    p_mat.use_nodes = True
    p_mat.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 10
    particle_obj.data.materials.append(p_mat)
    settings.render_type = 'OBJECT'
    settings.instance_object = particle_obj
    emitter.hide_render = True
    particle_obj.hide_render = True

def create_text(content):
    bpy.ops.object.text_add(location=(0, 0, 0), rotation=(math.radians(90), 0, 0))
    text_obj = bpy.context.object
    text_obj.data.body = content
    text_obj.data.align_x = 'CENTER'
    text_obj.data.align_y = 'CENTER'
    text_obj.data.extrude = 0.1
    text_obj.data.bevel_depth = 0.02
    mat = bpy.data.materials.new(name="TextMaterial")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.05, 0.4, 0.1, 1)
    bsdf.inputs["Roughness"].default_value = 0.1
    bsdf.inputs["Metallic"].default_value = 1.0
    text_obj.data.materials.append(mat)
    return text_obj

def create_crossing_spotlights(target_obj):
    for i, start_x in enumerate([-30, 30]):
        end_x = 30 if i == 0 else -30
        bpy.ops.object.light_add(type='SPOT', location=(start_x, -50, -10 if i==0 else 10))
        spot = bpy.context.object
        spot.data.energy = 500000
        spot.data.spot_size = math.radians(30)
        spot.data.shadow_soft_size = 1.5
        spot.keyframe_insert(data_path="location", frame=1)
        spot.location = (end_x, -50, 10 if i==0 else -10)
        spot.keyframe_insert(data_path="location", frame=120)
        track = spot.constraints.new(type='TRACK_TO')
        track.target = target_obj
        track.track_axis = 'TRACK_NEGATIVE_Z'
        track.up_axis = 'UP_Y'

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-video")
    parser.add_argument("--logo", default="docs/images/Greenhouse_Logo.png")
    parser.add_argument("--neuron", default="scripts/blender/neuron.fbx")
    parser.add_argument("--brain", default="scripts/blender/brain.fbx")
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    args = parser.parse_args(argv)
    scene = setup_scene()
    base_dir = os.getcwd()
    create_logo_background(os.path.join(base_dir, args.logo))
    import_brain(os.path.join(base_dir, args.brain))
    import_neurons(os.path.join(base_dir, args.neuron))
    create_neurotransmitters()
    create_text("GreenhouseMD")
    target = bpy.data.objects.new("Target", None)
    bpy.context.collection.objects.link(target)
    target.location = (0, 0, 0)
    create_crossing_spotlights(target)
    bpy.ops.object.camera_add(location=(0, -35, 0), rotation=(math.radians(90), 0, 0))
    scene.camera = bpy.context.object
    scene.camera.data.lens = 45
    if args.output_video:
        scene.render.filepath = args.output_video
        scene.render.image_settings.file_format = 'FFMPEG'
        scene.render.ffmpeg.format = 'MPEG4'
        scene.render.ffmpeg.codec = 'H264'
        bpy.ops.render.render(animation=True)

if __name__ == "__main__":
    main()

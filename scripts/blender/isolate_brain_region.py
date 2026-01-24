
import bpy
import bmesh
import os
import math
import mathutils
import json
import numpy as np
import sys

# --- RENDER CONFIGURATION ---
RENDER_CONFIG = {
    'engine': 'BLENDER_WORKBENCH',  # Options: 'BLENDER_WORKBENCH', 'CYCLES'
    'samples': 32,                 # Cycles samples (low to medium for legacy CPU)
    'output_path': '/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/branded_region_tour',
    'label_name': 'Field CA1',
    'frame_end': 60
}

def apply_high_fidelity_texture(obj, color=(0.1, 1.0, 1.0)):
    """
    Refined procedural texture for ROI highlighting.
    Optimized for Cycles CPU but compatible with Workbench.
    """
    mat_name = f"Mat_Premium_{obj.name}"
    mat = (bpy.data.materials.get(mat_name) or bpy.data.materials.new(name=mat_name))
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    # Texture logic
    coord = nodes.new(type='ShaderNodeTexCoord')
    voronoi = nodes.new(type='ShaderNodeTexVoronoi')
    voronoi.voronoi_dimensions = '3D'
    voronoi.feature = 'F1'
    voronoi.distance = 'EUCLIDEAN'
    voronoi.inputs['Scale'].default_value = 120.0 
    
    # Add some noise for organic detail
    noise = nodes.new(type='ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 20.0
    noise.inputs['Detail'].default_value = 2.0
    
    mix_tex = nodes.new(type='ShaderNodeMix')
    mix_tex.data_type = 'FLOAT'
    mix_tex.inputs['Factor'].default_value = 0.2
    
    ramp = nodes.new(type='ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.48
    ramp.color_ramp.elements[0].color = (0, 0, 0, 1)
    ramp.color_ramp.elements[1].position = 0.52
    ramp.color_ramp.elements[1].color = (*color, 1.0)
    
    emit = nodes.new(type='ShaderNodeEmission')
    emit.inputs['Strength'].default_value = 20.0 
    
    # Layer with Fresnel for "rim" glow
    fresnel = nodes.new(type='ShaderNodeFresnel')
    fresnel.inputs['IOR'].default_value = 1.45
    
    mix_emit = nodes.new(type='ShaderNodeMix')
    mix_emit.data_type = 'RGBA'
    
    output = nodes.new(type='ShaderNodeOutputMaterial')
    
    # Connections
    links.new(coord.outputs['Generated'], voronoi.inputs['Vector'])
    links.new(coord.outputs['Generated'], noise.inputs['Vector'])
    links.new(voronoi.outputs['Distance'], mix_tex.inputs[2])
    links.new(noise.outputs['Fac'], mix_tex.inputs[3])
    
    links.new(mix_tex.outputs[0], ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'], emit.inputs['Color'])
    
    # Output logic
    links.new(emit.outputs[0], output.inputs['Surface'])
    
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    # Enable transparency settings if needed for future FX
    mat.blend_method = 'BLEND'
    obj.show_in_front = True

def add_background_logo(logo_path, center_vec):
    if not os.path.exists(logo_path):
        print(f"Warning: Logo not found at {logo_path}")
        return None
        
    bpy.ops.mesh.primitive_plane_add(size=25, location=center_vec + mathutils.Vector((0, 15, 0)))
    plane = bpy.context.active_object
    plane.name = "BrandingPlane"
    plane.rotation_euler = (math.radians(90), 0, 0)
    
    mat = bpy.data.materials.new(name="LogoMaterial")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    
    tex = nodes.new(type='ShaderNodeTexImage')
    try:
        tex.image = bpy.data.images.load(logo_path)
    except:
        return None
        
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    output = nodes.new(type='ShaderNodeOutputMaterial')
    
    mat.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
    mat.node_tree.links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    
    plane.data.materials.append(mat)
    return plane

def setup_scene(config):
    label_name = config['label_name']
    print(f"\n--- Setting up Branded Scene [{config['engine']}]: {label_name} ---")
    
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    fbx_path = '/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/brain.fbx'
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    brain = bpy.context.selected_objects[0]
    
    data_dir = '/home/tamarojgreen/development/LLM/greenhouse_org/scripts/python'
    with open(os.path.join(data_dir, "region_map.json"), 'r') as f:
        region_map = json.load(f)
    label_id = next((int(k) for k, v in region_map.items() if v.lower() == label_name.lower()))
    labels = np.load(os.path.join(data_dir, "labels.npy"))
    indices = np.where(labels == label_id)[0]
    vertices_data = np.load(os.path.join(data_dir, "vertices.npy"))
    center = tuple(np.mean(vertices_data[indices], axis=0))
    center_vec = mathutils.Vector(center)
    
    h_obj = brain.copy()
    h_obj.data = brain.data.copy()
    h_obj.name = "Branded_ROI"
    bpy.context.scene.collection.objects.link(h_obj)
    
    bm = bmesh.new()
    bm.from_mesh(h_obj.data)
    bm.verts.ensure_lookup_table()
    valid_indices = set(indices)
    to_delete = [v for v in bm.verts if v.index not in valid_indices]
    bmesh.ops.delete(bm, geom=to_delete, context='VERTS')
    bm.to_mesh(h_obj.data)
    bm.free()
    h_obj.data.update()
    
    apply_high_fidelity_texture(h_obj, color=(0.1, 1.0, 1.0))
    
    logo_path = "/home/tamarojgreen/development/LLM/greenhouse_org/docs/images/Greenhouse_Logo.png"
    add_background_logo(logo_path, center_vec)
    
    bpy.ops.object.empty_add(type='PLAIN_AXES', location=center_vec)
    pivot = bpy.context.active_object
    
    bpy.ops.object.camera_add(location=center_vec + mathutils.Vector((0, -8, 4)))
    camera = bpy.context.active_object
    camera.parent = pivot
    camera.data.lens = 18 # Fit size 25 logo at distance 23
    bpy.context.scene.camera = camera
    
    track = camera.constraints.new(type='TRACK_TO')
    track.target = h_obj
    track.track_axis = 'TRACK_NEGATIVE_Z'
    track.up_axis = 'UP_Y'
    
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end = config['frame_end']
    pivot.rotation_euler = (0, 0, 0)
    pivot.keyframe_insert(data_path="rotation_euler", frame=1)
    pivot.rotation_euler = (0, 0, 0.4)
    pivot.keyframe_insert(data_path="rotation_euler", frame=scene.frame_end)
    
    # Engine Setup
    scene.render.engine = config['engine']
    if config['engine'] == 'CYCLES':
        scene.cycles.device = 'CPU'
        scene.cycles.samples = config['samples']
    
    bpy.ops.object.light_add(type='POINT', location=center_vec + mathutils.Vector((5, -5, 10)))
    light = bpy.context.active_object
    light.data.energy = 5000 if config['engine'] == 'CYCLES' else 1000
    
    return h_obj

def render_animation(config):
    scene = bpy.context.scene
    scene.render.image_settings.file_format = 'FFMPEG'
    
    scene.render.ffmpeg.format = 'MKV'
    scene.render.ffmpeg.codec = 'H264'
    scene.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    scene.render.ffmpeg.ffmpeg_preset = 'GOOD'
    scene.render.ffmpeg.audio_codec = 'NONE'
    
    scene.render.filepath = config['output_path']
    print(f"Initiating Branded Render [{config['engine']}]...")
    bpy.ops.render.render(animation=True)

if __name__ == "__main__":
    try:
        setup_scene(RENDER_CONFIG)
        render_animation(RENDER_CONFIG)
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")

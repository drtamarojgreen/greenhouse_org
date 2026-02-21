import bpy
import math
import mathutils
import random
import style_utilities as style

def create_rain_material():
    mat = bpy.data.materials.get("RainMat") or bpy.data.materials.new(name="RainMat")
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()
    node_out = nodes.new(type='ShaderNodeOutputMaterial'); node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    node_bsdf.inputs['Base Color'].default_value, node_bsdf.inputs['Roughness'].default_value, node_bsdf.inputs['Alpha'].default_value = (0.75, 0.85, 0.95, 1), 0.0, 0.15
    node_bsdf.inputs['Transmission Weight'].default_value = 0.9
    style.set_blend_method(mat, 'BLENDED'); links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])
    return mat

def create_rain_system(scene, frame_start, frame_end, intensity='MEDIUM', area_size=80):
    import bmesh
    sets = {'LIGHT':(2000,18,0.015), 'MEDIUM':(6000,22,0.012), 'HEAVY':(15000,28,0.010), 'STORM':(30000,35,0.008)}[intensity]
    mesh = bpy.data.meshes.new(f"Rain_{frame_start}"); emitter = bpy.data.objects.new(f"Rain_{frame_start}", mesh); bpy.context.scene.collection.objects.link(emitter); emitter.location = (0, 0, 35)
    bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=area_size/2); bm.to_mesh(mesh); bm.free()
    emitter.hide_render, emitter.hide_viewport = True, True
    emitter.modifiers.new(name="Rain", type='PARTICLE_SYSTEM'); ps = emitter.particle_systems[0].settings
    ps.type, ps.count, ps.frame_start, ps.frame_end, ps.lifetime, ps.lifetime_random = 'EMITTER', sets[0], frame_start, frame_end, 60, 0.2
    ps.normal_factor, ps.object_align_factor[2], ps.object_align_factor[1], ps.factor_random = 0.0, -sets[1], 2.0, 0.3
    ps.particle_size, ps.size_random, ps.render_type, ps.line_length_tail, ps.line_length_head = sets[2], 0.3, 'LINE', 0.8, 0.05
    ps.use_dynamic_rotation, ps.brownian_factor = True, 0.1
    return emitter

def create_puddle_material():
    mat = bpy.data.materials.get("WetMarble") or bpy.data.materials.new(name="WetMarble")
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()
    node_out = nodes.new(type='ShaderNodeOutputMaterial'); node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    node_checker = nodes.new(type='ShaderNodeTexChecker'); node_checker.inputs['Scale'].default_value = 10.0
    node_checker.inputs['Color1'].default_value, node_checker.inputs['Color2'].default_value = (0.04, 0.12, 0.05, 1), (0.30, 0.33, 0.28, 1)
    node_ripple = nodes.new(type='ShaderNodeTexNoise'); node_ripple.inputs['Scale'].default_value, node_ripple.inputs['Detail'].default_value = 8.0, 12.0
    node_bump = nodes.new(type='ShaderNodeBump'); node_bump.inputs['Strength'].default_value = 0.15
    links.new(node_checker.outputs['Color'], node_bsdf.inputs['Base Color']); links.new(node_ripple.outputs['Fac'], node_bump.inputs['Height']); links.new(node_bump.outputs['Normal'], node_bsdf.inputs['Normal'])
    node_bsdf.inputs['Roughness'].default_value, node_bsdf.inputs['Metallic'].default_value = 0.02, 0.0
    node_bsdf.inputs['Specular IOR Level'].default_value = 1.0
    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface']); mat.displacement_method = 'BOTH'
    return mat

def create_rain_splashes(location, count=20, frame_start=1, frame_end=15000):
    import bmesh; mat = bpy.data.materials.get("SplashMat") or bpy.data.materials.new(name="SplashMat")
    bsdf = mat.node_tree.nodes["Principled BSDF"]; bsdf.inputs['Alpha'].default_value, bsdf.inputs['Roughness'].default_value = 0.3, 0.0; style.set_blend_method(mat, 'BLENDED')
    mesh = bpy.data.meshes.new(f"Splashes_{frame_start}"); obj = bpy.data.objects.new(f"Splashes_{frame_start}", mesh); bpy.context.scene.collection.objects.link(obj); obj.location = location
    bm = bmesh.new()
    for i in range(count): bmesh.ops.create_circle(bm, segments=8, radius=0.05, matrix=mathutils.Matrix.Translation((random.uniform(-20, 20), random.uniform(-15, 15), -0.98)))
    bm.to_mesh(mesh); bm.free(); obj.data.materials.append(mat); style.insert_looping_noise(obj, "scale", strength=0.5, scale=5.0, frame_start=frame_start, frame_end=frame_end)
    return [obj]

def setup_wet_lens_compositor(scene, frame_start, frame_end):
    tree = style.get_compositor_node_tree(scene)
    distort = tree.nodes.get("Chromatic")
    if distort:
        sock = distort.inputs['Dispersion']; sock.default_value = 0.02; sock.keyframe_insert(data_path="default_value", frame=frame_start - 24)
        sock.default_value = 0.06; sock.keyframe_insert(data_path="default_value", frame=frame_start + 24)
        sock.keyframe_insert(data_path="default_value", frame=frame_end - 24); sock.default_value = 0.02; sock.keyframe_insert(data_path="default_value", frame=frame_end)

import bpy
import math
import mathutils
import style

def create_marble_floor_mat():
    mat = bpy.data.materials.get("CheckeredMarble") or bpy.data.materials.new(name="CheckeredMarble")
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()
    node_out = nodes.new(type='ShaderNodeOutputMaterial'); node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    node_checker = nodes.new(type='ShaderNodeTexChecker'); node_checker.inputs['Scale'].default_value = 10.0
    node_checker.inputs['Color1'].default_value, node_checker.inputs['Color2'].default_value = (0.106, 0.302, 0.118, 1), (0.769, 0.812, 0.729, 1)
    node_noise = nodes.new(type='ShaderNodeTexNoise'); node_noise.inputs['Scale'].default_value = 5.0
    node_mix = style.create_mix_node(mat.node_tree, blend_type='OVERLAY', data_type='RGBA')
    fac, in1, in2 = style.get_mix_sockets(node_mix); fac.default_value = 0.1
    links.new(node_checker.outputs['Color'], in1); links.new(node_noise.outputs['Fac'], in2); links.new(style.get_mix_output(node_mix), node_bsdf.inputs['Base Color'])
    node_bsdf.inputs['Roughness'].default_value, node_bsdf.inputs['Metallic'].default_value = 0.05, 0.1
    node_bsdf.inputs['Specular IOR Level'].default_value = 1.0
    node_disp_noise = nodes.new(type='ShaderNodeTexNoise'); node_disp = nodes.new(type='ShaderNodeDisplacement')
    links.new(node_disp_noise.outputs['Fac'], node_disp.inputs['Height']); links.new(node_disp.outputs['Displacement'], node_out.inputs['Displacement'])
    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface']); mat.displacement_method = 'BOTH'
    return mat

def setup_volumetric_haze(density=0.005):
    nodes, links = bpy.context.scene.world.node_tree.nodes, bpy.context.scene.world.node_tree.links
    vol = nodes.get("Volume Scatter") or nodes.new(type='ShaderNodeVolumeScatter')
    vol.inputs['Density'].default_value, vol.inputs['Anisotropy'].default_value = density, 0.5
    out = nodes.get("World Output")
    if out: links.new(vol.outputs['Volume'], out.inputs['Volume'])

def create_stage_floor(location=(0,0,-1), size=40):
    import bmesh; mesh_data = bpy.data.meshes.new("Floor_MeshData"); obj = bpy.data.objects.new("ExpressionistFloor", mesh_data); bpy.context.scene.collection.objects.link(obj); obj.location = location
    bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=size/2); bm.to_mesh(mesh_data); bm.free()
    obj.data.materials.append(create_marble_floor_mat()); style.setup_caustic_patterns(obj)
    return obj

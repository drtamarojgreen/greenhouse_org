import bpy
import math
import mathutils
import style_utilities as style

def create_marble_floor_mat():
    mat = bpy.data.materials.get("CheckeredMarble") or bpy.data.materials.new(name="CheckeredMarble")
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()
    node_out = nodes.new(type='ShaderNodeOutputMaterial'); node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    # Phase 6: De-chessboard (Mossy Stone)
    node_coord = nodes.new(type='ShaderNodeTexCoord')
    node_noise = nodes.new(type='ShaderNodeTexNoise'); node_noise.inputs['Scale'].default_value = 2.0
    node_voronoi = nodes.new(type='ShaderNodeTexVoronoi'); node_voronoi.inputs['Scale'].default_value = 8.0
    
    node_ramp = nodes.new(type='ShaderNodeValToRGB')
    elements = node_ramp.color_ramp.elements
    elements[0].position, elements[0].color = 0.2, (0.05, 0.1, 0.05, 1) # Dark Moss
    elements[1].position, elements[1].color = 0.8, (0.2, 0.15, 0.1, 1) # Stone
    
    links.new(node_coord.outputs['Generated'], node_noise.inputs['Vector'])
    links.new(node_noise.outputs['Fac'], node_voronoi.inputs['Vector'])
    links.new(node_voronoi.outputs['Distance'], node_ramp.inputs['Fac'])
    links.new(node_ramp.outputs['Color'], node_bsdf.inputs['Base Color'])
    
    node_bsdf.inputs['Roughness'].default_value, node_bsdf.inputs['Metallic'].default_value = 0.9, 0.0
    node_bsdf.inputs['Specular IOR Level'].default_value = 0.2
    
    node_disp_noise = nodes.new(type='ShaderNodeTexNoise'); node_disp = nodes.new(type='ShaderNodeDisplacement')
    node_disp.inputs['Scale'].default_value = 0.05
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

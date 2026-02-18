import bpy
import math
import mathutils
import style

def create_marble_floor_mat():
    mat = bpy.data.materials.get("CheckeredMarble")
    if mat: return mat
    mat = bpy.data.materials.new(name="CheckeredMarble")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    node_out = nodes.new(type='ShaderNodeOutputMaterial')
    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')

    # Checkered Texture using Greenhouse Palette
    node_checker = nodes.new(type='ShaderNodeTexChecker')
    node_checker.inputs['Scale'].default_value = 10.0
    node_checker.inputs['Color1'].default_value = (0.106, 0.302, 0.118, 1) # Brand Green
    node_checker.inputs['Color2'].default_value = (0.769, 0.812, 0.729, 1) # Pale Sage

    # Noise for marble veins
    node_noise = nodes.new(type='ShaderNodeTexNoise')
    node_noise.inputs['Scale'].default_value = 5.0
    node_noise.inputs['Detail'].default_value = 15.0

    node_mix = style.create_mix_node(mat.node_tree, 'ShaderNodeMixRGB', 'ShaderNodeMix', blend_type='OVERLAY', data_type='RGBA')
    fac_sock, in1_sock, in2_sock = style.get_mix_sockets(node_mix)
    fac_sock.default_value = 0.1

    links.new(node_checker.outputs['Color'], in1_sock)
    links.new(node_noise.outputs['Fac'], in2_sock)
    links.new(style.get_mix_output(node_mix), node_bsdf.inputs['Base Color'])

    node_bsdf.inputs['Roughness'].default_value = 0.05
    node_bsdf.inputs['Metallic'].default_value = 0.1

    # Wet Surface Gloss (Guarded for Blender 5.0 naming drift)
    style.set_principled_socket(node_bsdf, 'Specular', 1.0)

    # Organic Floor Craters (Noise for Displacement)
    node_disp_noise = nodes.new(type='ShaderNodeTexNoise')
    node_disp_noise.inputs['Scale'].default_value = 2.0
    node_disp = nodes.new(type='ShaderNodeDisplacement')
    links.new(node_disp_noise.outputs['Fac'], node_disp.inputs['Height'])
    links.new(node_disp.outputs['Displacement'], node_out.inputs['Displacement'])

    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])

    # Point 78: Enable Cycles displacement
    mat.cycles.displacement_method = 'BOTH'

    return mat

def setup_volumetric_haze(density=0.005):
    """Sets up volumetric haze in the world shader. Density lowered to prevent occlusion."""
    world = bpy.context.scene.world
    world.use_nodes = True
    nodes = world.node_tree.nodes
    links = world.node_tree.links

    # Find or create Volume Scatter node
    vol = nodes.get("Volume Scatter") or nodes.new(type='ShaderNodeVolumeScatter')
    vol.inputs['Density'].default_value = density
    vol.inputs['Anisotropy'].default_value = 0.5

    out = nodes.get("World Output")
    if out:
        links.new(vol.outputs['Volume'], out.inputs['Volume'])

def create_stage_floor(location=(0,0,-1), size=40):
    """Creates a checkered marble stage floor."""
    bpy.ops.mesh.primitive_plane_add(size=size, location=location)
    floor = bpy.context.object
    floor.name = "ExpressionistFloor"
    floor.data.materials.append(create_marble_floor_mat())

    # Enhancement #24: Caustic Light Patterns on Floor
    style.setup_caustic_patterns(floor)

    return floor

if __name__ == "__main__":
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    create_stage_floor()
    setup_volumetric_haze()

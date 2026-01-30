import bpy
import math
import mathutils

def create_wood_material(name, color=(0.15, 0.08, 0.05)):
    """Creates a procedural dark wood material."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    node_output = nodes.new(type='ShaderNodeOutputMaterial')
    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')

    node_coord = nodes.new(type='ShaderNodeTexCoord')
    node_mapping = nodes.new(type='ShaderNodeMapping')
    links.new(node_coord.outputs['Generated'], node_mapping.inputs['Vector'])

    # Wood grain using Wave texture
    node_wave = nodes.new(type='ShaderNodeTexWave')
    node_wave.wave_type = 'RINGS'
    node_wave.inputs['Scale'].default_value = 5.0
    node_wave.inputs['Distortion'].default_value = 10.0
    node_wave.inputs['Detail'].default_value = 15.0
    links.new(node_mapping.outputs['Vector'], node_wave.inputs['Vector'])

    node_ramp = nodes.new(type='ShaderNodeValToRGB')
    node_ramp.color_ramp.elements[0].color = (*[c*0.6 for c in color], 1)
    node_ramp.color_ramp.elements[1].color = (*color, 1)

    links.new(node_wave.outputs['Color'], node_ramp.inputs['Fac'])
    links.new(node_ramp.outputs['Color'], node_bsdf.inputs['Base Color'])
    links.new(node_bsdf.outputs['BSDF'], node_output.inputs['Surface'])

    node_bsdf.inputs['Roughness'].default_value = 0.3
    return mat

def create_pedestal(location, height=1.2):
    """Creates a stone or wood pedestal for the book."""
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location + mathutils.Vector((0,0,height/2)))
    pedestal = bpy.context.object
    pedestal.name = "Pedestal"
    pedestal.scale = (0.5, 0.5, height/2)

    mat = create_wood_material("PedestalMat")
    pedestal.data.materials.append(mat)
    return pedestal

def create_paper_material(name):
    """Creates a procedural aged paper/parchment material."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    node_output = nodes.new(type='ShaderNodeOutputMaterial')
    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')

    node_coord = nodes.new(type='ShaderNodeTexCoord')
    node_mapping = nodes.new(type='ShaderNodeMapping')
    links.new(node_coord.outputs['Generated'], node_mapping.inputs['Vector'])

    # Noise for stains/yellowing
    node_noise = nodes.new(type='ShaderNodeTexNoise')
    node_noise.inputs['Scale'].default_value = 12.0
    node_noise.inputs['Detail'].default_value = 15.0
    links.new(node_mapping.outputs['Vector'], node_noise.inputs['Vector'])

    node_ramp = nodes.new(type='ShaderNodeValToRGB')
    node_ramp.color_ramp.elements[0].color = (0.8, 0.7, 0.5, 1) # Darker stain
    node_ramp.color_ramp.elements[1].color = (0.95, 0.9, 0.8, 1) # Main paper

    links.new(node_noise.outputs['Fac'], node_ramp.inputs['Fac'])
    links.new(node_ramp.outputs['Color'], node_bsdf.inputs['Base Color'])
    links.new(node_bsdf.outputs['BSDF'], node_output.inputs['Surface'])

    node_bsdf.inputs['Roughness'].default_value = 0.8
    return mat

def create_open_book(location):
    """Creates a large open book asset."""
    container = bpy.data.objects.new("BookContainer", None)
    bpy.context.scene.collection.objects.link(container)
    container.location = location

    # Left Page
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=location + mathutils.Vector((-0.5, 0, 0.1)))
    left = bpy.context.object
    left.name = "Page_Left"
    left.rotation_euler = (0, math.radians(-10), 0)
    left.parent = container
    left.matrix_parent_inverse = container.matrix_world.inverted()

    # Right Page
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=location + mathutils.Vector((0.5, 0, 0.1)))
    right = bpy.context.object
    right.name = "Page_Right"
    right.rotation_euler = (0, math.radians(10), 0)
    right.parent = container
    right.matrix_parent_inverse = container.matrix_world.inverted()

    # Material
    mat = create_paper_material("PageMat")
    left.data.materials.append(mat)
    right.data.materials.append(mat)

    return container

if __name__ == "__main__":
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    create_pedestal(mathutils.Vector((0,0,0)))
    create_open_book(mathutils.Vector((0,0,1.2)))

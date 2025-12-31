
import bpy

def apply_procedural_texture(obj, material_name="ProceduralBrain"):
    """
    Applies a procedural noise-based material to an object.

    :param obj: The object to apply the material to.
    :param material_name: The name for the new material.
    """
    # Create a new material
    mat = bpy.data.materials.new(name=material_name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes

    # Clear default nodes
    nodes.clear()

    # Add Principled BSDF shader
    shader = nodes.new(type='ShaderNodeBsdfPrincipled')
    shader.location = (0, 0)

    # Add Noise Texture node
    noise_tex = nodes.new(type='ShaderNodeTexNoise')
    noise_tex.location = (-400, 0)

    # Add ColorRamp node
    color_ramp = nodes.new(type='ShaderNodeValToRGB')
    color_ramp.location = (-200, 0)
    color_ramp.color_ramp.elements[0].color = (0.8, 0.1, 0.1, 1) # Dark Red
    color_ramp.color_ramp.elements[1].color = (1, 0.8, 0.8, 1) # Light Pink

    # Add Material Output node
    output = nodes.new(type='ShaderNodeOutputMaterial')
    output.location = (200, 0)

    # Link nodes
    links = mat.node_tree.links
    links.new(noise_tex.outputs['Fac'], color_ramp.inputs['Fac'])
    links.new(color_ramp.outputs['Color'], shader.inputs['Base Color'])
    links.new(shader.outputs['BSDF'], output.inputs['Surface'])

    # Assign material to object
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)

def create_wireframe_overlay(obj, material_name="WireframeMaterial", thickness=0.01):
    """
    Creates a wireframe overlay for an object.

    :param obj: The object to create the overlay for.
    :param material_name: The name for the wireframe material.
    :param thickness: The thickness of the wireframe.
    :return: The new wireframe object.
    """
    # Duplicate the object
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.duplicate()
    wireframe_obj = bpy.context.active_object
    wireframe_obj.name = obj.name + "_Wireframe"

    # Add Wireframe modifier
    modifier = wireframe_obj.modifiers.new(name="Wireframe", type='WIREFRAME')
    modifier.thickness = thickness

    # Create a simple emission material for the wireframe
    mat = bpy.data.materials.new(name=material_name)
    mat.use_nodes = True
    mat.node_tree.nodes.clear()

    output = mat.node_tree.nodes.new(type='ShaderNodeOutputMaterial')
    emission = mat.node_tree.nodes.new(type='ShaderNodeEmission')
    emission.inputs['Color'].default_value = (0, 1, 1, 1) # Cyan
    emission.inputs['Strength'].default_value = 5.0

    mat.node_tree.links.new(emission.outputs['Emission'], output.inputs['Surface'])

    # Assign material
    if wireframe_obj.data.materials:
        wireframe_obj.data.materials[0] = mat
    else:
        wireframe_obj.data.materials.append(mat)

    return wireframe_obj

def apply_glowing_material(obj, material_name="GlowingBrain", color=(1, 0.5, 0), strength=10.0):
    """
    Applies a glowing (emission) material to an object and enables bloom.

    :param obj: The object to apply the material to.
    :param material_name: The name for the new material.
    :param color: The RGB color of the emission.
    :param strength: The strength of the emission.
    """
    # Enable Bloom for the Eevee render engine (Eevee Next in 4.2+)
    if bpy.context.scene.render.engine in ['BLENDER_EEVEE', 'BLENDER_EEVEE_NEXT']:
        # In 4.2+, bloom is part of the Raytracing/Post Process settings or just automatic
        if hasattr(bpy.context.scene, "eevee"):
            bpy.context.scene.eevee.use_bloom = True

    # Create a new material
    mat = bpy.data.materials.new(name=material_name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()

    # Add Emission and Output nodes
    output = nodes.new(type='ShaderNodeOutputMaterial')
    emission = nodes.new(type='ShaderNodeEmission')

    # Set color and strength
    emission.inputs['Color'].default_value = (*color, 1)
    emission.inputs['Strength'].default_value = strength

    # Link nodes
    mat.node_tree.links.new(emission.outputs['Emission'], output.inputs['Surface'])

    # Assign material to object
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)

def apply_neon_glow(obj, color=(0.1, 1.0, 1.0), strength=20.0, material_name="NeonGlow"):
    """
    Applies a neon-like glowing material to an object.
    
    :param obj: The object to apply the material to.
    :param color: The RGB color for the glow.
    :param strength: The emission strength.
    :param material_name: The name for the material.
    """
    # Create the material
    mat = bpy.data.materials.new(name=material_name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    
    output = nodes.new(type='ShaderNodeOutputMaterial')
    emission = nodes.new(type='ShaderNodeEmission')
    
    emission.inputs['Color'].default_value = (*color, 1)
    emission.inputs['Strength'].default_value = strength
    
    mat.node_tree.links.new(emission.outputs['Emission'], output.inputs['Surface'])
    
    # Assign material
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)
    
    # Setup Compositon for the 'Neon' look if not already done
    setup_neon_compositor()

def setup_neon_compositor():
    """
    Sets up the compositor nodes for a glare/bloom effect.
    """
    bpy.context.scene.use_nodes = True
    tree = bpy.context.scene.node_tree
    nodes = tree.nodes
    
    # Clear nodes
    for node in nodes:
        nodes.remove(node)
        
    render_layers = nodes.new(type='CompositorNodeRLayers')
    composite = nodes.new(type='CompositorNodeComposite')
    glare = nodes.new(type='CompositorNodeGlare')
    
    glare.glare_type = 'FOG_GLOW'
    glare.quality = 'HIGH'
    glare.size = 8
    glare.threshold = 0.5
    
    tree.links.new(render_layers.outputs['Image'], glare.inputs['Image'])
    tree.links.new(glare.outputs['Image'], composite.inputs['Image'])

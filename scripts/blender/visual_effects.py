
import bpy

def apply_textured_highlight(obj, color=(0.1, 1.0, 1.0)):
    """
    STABLE Implementation for Plan 01: High-Visibility Solid Neon.
    Procedural textures caused segfaults in headless Workbench;
    reverting to solid emission for guaranteed stability.
    """
    mat_name = f"Mat_ROI_{obj.name}"
    if mat_name in bpy.data.materials:
        mat = bpy.data.materials[mat_name]
    else:
        mat = bpy.data.materials.new(name=mat_name)
    
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    # 1. Emission (Solid)
    emit = nodes.new(type='ShaderNodeEmission')
    emit.inputs['Color'].default_value = (*color, 1)
    emit.inputs['Strength'].default_value = 5.0
    
    # 2. Output
    output = nodes.new(type='ShaderNodeOutputMaterial')
    links.new(emit.outputs[0], output.inputs['Surface'])
    
    # Application
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    
    # Visibility Settings
    obj.show_in_front = True # Essential for seeing through main brain
    obj.display_type = 'SOLID'

def setup_neuron_materials():
    """
    Standard neuron material setup.
    """
    mat = bpy.data.materials.new(name="NeuronMat")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    output = nodes.new(type='ShaderNodeOutputMaterial')
    emission = nodes.new(type='ShaderNodeEmission')
    emission.inputs['Color'].default_value = (0.2, 0.6, 1.0, 1)
    emission.inputs['Strength'].default_value = 10.0
    mat.node_tree.links.new(emission.outputs['Emission'], output.inputs['Surface'])
    
    if "Neurons" in bpy.data.collections:
        for obj in bpy.data.collections["Neurons"].objects:
            if obj.type == 'MESH':
                obj.data.materials.append(mat)

def apply_neuron_texture(obj):
    """
    Applies a procedural noise texture to the neurons.
    """
    mat_name = "NeuronTexture"
    if mat_name in bpy.data.materials:
        mat = bpy.data.materials[mat_name]
    else:
        mat = bpy.data.materials.new(name=mat_name)
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        links = mat.node_tree.links
        nodes.clear()

        # Add nodes
        output = nodes.new(type='ShaderNodeOutputMaterial')
        emission = nodes.new(type='ShaderNodeEmission')
        tex_noise = nodes.new(type='ShaderNodeTexNoise')
        color_ramp = nodes.new(type='ShaderNodeValToRGB')

        # Configure noise texture
        tex_noise.inputs['Scale'].default_value = 10.0
        tex_noise.inputs['Detail'].default_value = 15.0
        tex_noise.inputs['Roughness'].default_value = 0.9

        # Configure color ramp
        color_ramp.color_ramp.elements[0].color = (0.2, 0.6, 1.0, 1)
        color_ramp.color_ramp.elements[1].color = (0.8, 1.0, 1.0, 1)

        # Link nodes
        links.new(tex_noise.outputs['Fac'], color_ramp.inputs['Fac'])
        links.new(color_ramp.outputs['Color'], emission.inputs['Color'])
        emission.inputs['Strength'].default_value = 20.0
        links.new(emission.outputs['Emission'], output.inputs['Surface'])

    # Assign material
    obj.data.materials.clear()
    obj.data.materials.append(mat)

def apply_brain_texture(obj):
    """
    Applies a procedural noise texture to the brain model.
    """
    mat_name = "BrainTexture"
    if mat_name in bpy.data.materials:
        mat = bpy.data.materials[mat_name]
    else:
        mat = bpy.data.materials.new(name=mat_name)
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        links = mat.node_tree.links
        nodes.clear()

        # Add nodes
        output = nodes.new(type='ShaderNodeOutputMaterial')
        principled = nodes.new(type='ShaderNodeBsdfPrincipled')
        tex_noise = nodes.new(type='ShaderNodeTexNoise')
        color_ramp = nodes.new(type='ShaderNodeValToRGB')

        # Configure noise texture
        tex_noise.inputs['Scale'].default_value = 5.0
        tex_noise.inputs['Detail'].default_value = 10.0
        tex_noise.inputs['Roughness'].default_value = 0.8

        # Configure color ramp
        color_ramp.color_ramp.elements[0].color = (0.1, 0.1, 0.1, 1)
        color_ramp.color_ramp.elements[1].color = (0.5, 0.5, 0.5, 1)

        # Link nodes
        links.new(tex_noise.outputs['Fac'], color_ramp.inputs['Fac'])
        links.new(color_ramp.outputs['Color'], principled.inputs['Base Color'])
        links.new(principled.outputs['BSDF'], output.inputs['Surface'])

    # Assign material
    obj.data.materials.clear()
    obj.data.materials.append(mat)

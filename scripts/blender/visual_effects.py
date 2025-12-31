
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

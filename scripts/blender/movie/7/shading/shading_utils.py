import bpy

def setup_iris_nodes(mat, color):
    """Sets up a procedural iris node tree with ocular depth."""
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    out = nodes.new(type='ShaderNodeOutputMaterial')
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    
    tex_coord = nodes.new(type='ShaderNodeTexCoord')
    gradient = nodes.new(type='ShaderNodeTexGradient')
    gradient.gradient_type = 'QUADRATIC_SPHERE'
    ramp = nodes.new(type='ShaderNodeValToRGB')
    
    # Setup ColorRamp: Pupil (Black) -> Iris (Color) -> Sclera (White)
    ramp.color_ramp.elements[0].position = 0.15
    ramp.color_ramp.elements[0].color = (0, 0, 0, 1)
    ramp.color_ramp.elements[1].position = 0.45
    ramp.color_ramp.elements[1].color = (*color[:3], 1.0)
    
    new_elt = ramp.color_ramp.elements.new(0.6)
    new_elt.color = (1, 1, 1, 1)
    
    links.new(tex_coord.outputs['Generated'], gradient.inputs['Vector'])
    links.new(gradient.outputs['Fac'], ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'], bsdf.inputs['Base Color'])
    
    # Emission for ocular depth 'glow'
    if 'Emission' in bsdf.inputs:
        links.new(ramp.outputs['Color'], bsdf.inputs['Emission'])
        # Handle Blender 4.0+ Emission Strength
        strength_input = bsdf.inputs.get('Emission Strength')
        if strength_input:
            strength_input.default_value = 0.5

def setup_sss(bsdf, color=(0.2, 0.5, 0.1, 1.0), weight=0.15):
    """Sets up subsurface scattering on a BSDF node, handling Blender version differences."""
    # Blender < 4.0
    if 'Subsurface' in bsdf.inputs:
        bsdf.inputs['Subsurface'].default_value = weight
        if 'Subsurface Color' in bsdf.inputs:
            bsdf.inputs['Subsurface Color'].default_value = color
    # Blender 4.0+
    elif 'Subsurface Weight' in bsdf.inputs:
        bsdf.inputs['Subsurface Weight'].default_value = weight
        # Color is usually handled via 'Subsurface Radius' or 'Base Color' + 'Subsurface' in 4.0
        # But we set the radius/scale if available
        if 'Subsurface Radius' in bsdf.inputs:
            bsdf.inputs['Subsurface Radius'].default_value = (1.0, 0.2, 0.1)

def setup_basic_material(mat, color, emission=0.0):
    """Sets up a basic principled BSDF material."""
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    out = nodes.new(type='ShaderNodeOutputMaterial')
    bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    mat.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    
    bsdf.inputs['Base Color'].default_value = (*color[:3], 1.0)
    if 'Emission' in bsdf.inputs:
        bsdf.inputs['Emission'].default_value = (*color[:3], 1.0)
        strength_input = bsdf.inputs.get('Emission Strength') or bsdf.inputs.get('Emission')
        if strength_input and hasattr(strength_input, "default_value"):
            strength_input.default_value = emission

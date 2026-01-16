
import bpy

def setup_background(image_path):
    """
    Configures the scene to use an image as a background.
    - Switches to Eevee.
    - Sets transparent background.
    - Uses compositor to overlay the image.
    """
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.render.film_transparent = True

    # Enable compositor
    scene.use_nodes = True
    tree = scene.node_tree

    # --- NON-DESTRUCTIVE NODE SETUP ---
    # Check for existing nodes to avoid duplication and errors.
    render_layers = tree.nodes.get('Render Layers') or tree.nodes.new('CompositorNodeRLayers')
    composite_node = tree.nodes.get('Composite') or tree.nodes.new('CompositorNodeComposite')

    # Create our custom nodes if they don't exist
    if "BackgroundImage" in tree.nodes:
        image_node = tree.nodes["BackgroundImage"]
    else:
        image_node = tree.nodes.new('CompositorNodeImage')
        image_node.name = "BackgroundImage"

    if "AlphaOverBackground" in tree.nodes:
        alpha_over = tree.nodes["AlphaOverBackground"]
    else:
        alpha_over = tree.nodes.new('CompositorNodeAlphaOver')
        alpha_over.name = "AlphaOverBackground"

    # Load image
    try:
        image_node.image = bpy.data.images.load(image_path)
    except Exception as e:
        print(f"Error loading background image: {e}")
        return

    # Link nodes
    tree.links.new(image_node.outputs['Image'], alpha_over.inputs[1])
    tree.links.new(render_layers.outputs['Image'], alpha_over.inputs[2])
    tree.links.new(alpha_over.outputs['Image'], composite_node.inputs['Image'])

def apply_textured_highlight(obj, color=(0.1, 1.0, 1.0)):
    """
    High-Fidelity Fresnel-based Glowing Highlight.
    Utilizes a rim glow effect for a premium scientific look.
    """
    mat_name = f"Mat_Premium_ROI_{obj.name}"
    mat = (bpy.data.materials.get(mat_name) or bpy.data.materials.new(name=mat_name))
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    # Emission for the core glow
    emit = nodes.new(type='ShaderNodeEmission')
    emit.inputs['Color'].default_value = (*color, 1)
    emit.inputs['Strength'].default_value = 15.0
    
    # Fresnel for the rim glow effect
    fresnel = nodes.new(type='ShaderNodeFresnel')
    fresnel.inputs['IOR'].default_value = 1.45
    
    # Mix based on fresnel for deeper aesthetic
    mix = nodes.new(type='ShaderNodeMix')
    mix.data_type = 'RGBA'
    mix.inputs['A'].default_value = (*color, 0.4)
    mix.inputs['B'].default_value = (*color, 1.0)
    links.new(fresnel.outputs[0], mix.inputs['Factor'])
    links.new(mix.outputs[2], emit.inputs['Color'])
    
    output = nodes.new(type='ShaderNodeOutputMaterial')
    links.new(emit.outputs[0], output.inputs['Surface'])
    
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    
    # Visibility Settings
    obj.show_in_front = True
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

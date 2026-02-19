import bpy
import style

def setup_compositor(master_instance):
    """Sets up the filmic compositor pipeline with silent movie effects."""
    scene = master_instance.scene
    tree = style.get_compositor_node_tree(scene)
    if not tree: return

    # Clear tree
    for n in tree.nodes: tree.nodes.remove(n)

    # Nodes
    render_layers = tree.nodes.new('CompositorNodeRLayers')
    composite = style.create_compositor_output(tree)

    # Enhancement #55: Bloom/Glow for Bioluminescence
    glare = tree.nodes.new('CompositorNodeGlare')
    style.set_node_input(glare, 'Type', 'FOG_GLOW')
    style.set_node_input(glare, 'Size', 8)
    style.set_node_input(glare, 'Threshold', 0.5)

    # Enhancement #60: Lens Distortion / Chromatic Aberration
    distort = style.setup_chromatic_aberration(scene, strength=0.02)

    # Enhancement #59: Vignette (Breathing)
    vignette = tree.nodes.new('CompositorNodeEllipseMask')
    vignette.name = "Vignette"
    style.set_node_input(vignette, 'Size', [0.8, 0.8])

    # Mix vignette
    mix_vig = tree.nodes.new('ShaderNodeMix')
    mix_vig.data_type = 'RGBA'
    style.set_node_input(mix_vig, 'blend_type', 'MULTIPLY')

    # Enhancement #60: Wet Glass Refraction (Displacement)
    # Texture node is replaced by Image node in typical 5.0 workflows for displacement
    tex_node = tree.nodes.new('CompositorNodeImage')
        
    # We need a noise texture datablock
    noise_tex = bpy.data.textures.get("WetGlassNoise") or bpy.data.textures.new("WetGlassNoise", type='NOISE')
    # Note: Noise textures in 5.0 are often handled differently (e.g. via Texture node if it exists or Image)
    # But for a procedural setup, we'll stick to a placeholder or direct socket support if available.

    displace = tree.nodes.new('CompositorNodeDisplace')
    displace.name = "WetGlass"
    style.set_node_input(displace, 'Interpolation', 'Bilinear')
    style.set_node_input(displace, 'Displacement', [0.0, 0.0])

    # Enhancement #49: Iris Wipe
    iris = tree.nodes.new('CompositorNodeEllipseMask')
    iris.name = "IrisWipe"
    style.set_node_input(iris, 'Size', [2.0, 2.0])

    mix_iris = tree.nodes.new('ShaderNodeMix')
    mix_iris.data_type = 'RGBA'
    style.set_node_input(mix_iris, 'blend_type', 'MULTIPLY')

    # Film Grain / Flicker
    style.apply_film_flicker(scene, 1, 15000, strength=0.03)

    # Global Saturation
    style.setup_saturation_control(scene)
    huesat = tree.nodes.get("GlobalSaturation")

    # Links
    tree.links.new(render_layers.outputs['Image'], glare.inputs['Image'])
    tree.links.new(glare.outputs['Image'], displace.inputs['Image'])
    
    # Texture link
    if len(tex_node.outputs) > 0:
        tree.links.new(tex_node.outputs[0], displace.inputs['Displacement'])
 
    # Use style helpers for Mix nodes
    vig_fac, vig_a, vig_b = style.get_mix_sockets(mix_vig)
    iris_fac, iris_a, iris_b = style.get_mix_sockets(mix_iris)
 
    tree.links.new(displace.outputs['Image'], vig_a)
    tree.links.new(vignette.outputs['Mask'], vig_b)
    
    tree.links.new(style.get_mix_output(mix_vig), iris_a)
    tree.links.new(iris.outputs['Mask'], iris_b)
    
    tree.links.new(style.get_mix_output(mix_iris), huesat.inputs['Image'])
    tree.links.new(huesat.outputs['Image'], composite.inputs['Image'])

def animate_wet_glass(scene, frame_start, frame_end, strength=10.0):
    """Enhancement #60: Animates wet glass refraction strength."""
    tree = style.get_compositor_node_tree(scene)
    displace = tree.nodes.get("WetGlass")
    if not displace: return

    # In 5.0, Displacement is a Vector socket. We might need to keyframe X/Y
    target = style.get_socket_by_identifier(displace.inputs, 'Displacement')
    if target:
        target.default_value = (0.0, 0.0)
        target.keyframe_insert(data_path="default_value", frame=frame_start - 12)
        target.default_value = (strength, strength)
        target.keyframe_insert(data_path="default_value", frame=frame_start)
        target.keyframe_insert(data_path="default_value", frame=frame_end)
        target.default_value = (0.0, 0.0)
        target.keyframe_insert(data_path="default_value", frame=frame_end + 12)

def animate_iris_wipe(scene, frame_start, frame_end, mode='IN'):
    """Enhancement #49: Iris Wipe transition animation."""
    tree = style.get_compositor_node_tree(scene)
    iris = tree.nodes.get("IrisWipe")
    if not iris: return

    target = style.get_socket_by_identifier(iris.inputs, 'Size') or style.get_socket_by_identifier(iris.inputs, 'Width')
    
    if mode == 'IN':
        style.set_node_input(iris, 'Size', [0.0, 0.0])
        if target:
            target.keyframe_insert(data_path="default_value", frame=frame_start)
            style.set_node_input(iris, 'Size', [2.0, 2.0])
            target.keyframe_insert(data_path="default_value", frame=frame_end)
    else: # OUT
        style.set_node_input(iris, 'Size', [2.0, 2.0])
        if target:
            target.keyframe_insert(data_path="default_value", frame=frame_start)
            style.set_node_input(iris, 'Size', [0.0, 0.0])
            target.keyframe_insert(data_path="default_value", frame=frame_end)

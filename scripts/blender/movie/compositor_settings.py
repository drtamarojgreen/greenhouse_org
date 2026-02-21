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
    distort = tree.nodes.new('CompositorNodeLensdist')
    distort.name = "ChromaticAberration"
    style.set_node_input(distort, 'Dispersion', 0.02)

    # Enhancement #60: Wet Glass Refraction (Simplified displacement)
    displace = tree.nodes.new('CompositorNodeDisplace')
    displace.name = "WetGlass"
    
    # Point 92: Safe creation of Texture node (often missing in 5.0+)
    try:
        tex_node = tree.nodes.new('CompositorNodeTexture')
        noise_tex = bpy.data.textures.get("WetGlassNoise") or bpy.data.textures.new("WetGlassNoise", type='NOISE')
        tex_node.texture = noise_tex
        tree.links.new(tex_node.outputs['Value'], displace.inputs['Displacement'])
    except RuntimeError:
        # Fallback: skip procedural noise if Texture node is missing
        pass

    # Brightness/Contrast (Film Flicker)
    bright = tree.nodes.new('CompositorNodeBrightContrast')
    bright.name = "Bright/Contrast"

    # Glow Trail (Vector Blur)
    blur = tree.nodes.new('CompositorNodeVecBlur')
    blur.name = "GlowTrail"
    style.set_node_input(blur, 'Factor', 0.8)

    # Global Saturation
    huesat = tree.nodes.new('CompositorNodeHueSat')
    huesat.name = "GlobalSaturation"

    # Links
    # 1. Main Path
    tree.links.new(render_layers.outputs['Image'], glare.inputs['Image'])
    tree.links.new(glare.outputs['Image'], blur.inputs['Image'])
    tree.links.new(blur.outputs['Image'], bright.inputs['Image'])
    tree.links.new(bright.outputs['Image'], distort.inputs['Image'])
    tree.links.new(distort.outputs['Image'], displace.inputs['Image'])
    
    # 4. Final Output
    tree.links.new(displace.outputs['Image'], huesat.inputs['Image'])
    tree.links.new(huesat.outputs['Image'], composite.inputs['Image'])

def animate_wet_glass(scene, frame_start, frame_end, strength=10.0):
    """Enhancement #60: Animates wet glass refraction strength."""
    tree = style.get_compositor_node_tree(scene)
    displace = tree.nodes.get("WetGlass")
    if not displace: return

    # Point 92: Search for Scale/Factor sockets (X/Y Scale in modern Displace)
    targets = []
    for name in ['X Scale', 'Y Scale', 'X', 'Y', 'Factor', 'Scale']:
        s = style.get_socket_by_identifier(displace.inputs, name) or displace.inputs.get(name)
        if s: targets.append(s)
    
    if not targets and len(displace.inputs) > 1:
        # Avoid input[0] which is usually Image
        targets = [displace.inputs[1]]

    for target in targets:
        style.set_socket_value(target, 0.0, frame=frame_start - 12)
        style.set_socket_value(target, strength, frame=frame_start)
        style.set_socket_value(target, strength, frame=frame_end)
        style.set_socket_value(target, 0.0, frame=frame_end + 12)

def animate_iris_wipe(scene, frame_start, frame_end, mode='IN'):
    """Enhancement #49: Iris Wipe transition animation."""
    tree = style.get_compositor_node_tree(scene)
    iris = tree.nodes.get("IrisWipe")
    if not iris: return

    if mode == 'IN':
        style.set_node_input(iris, 'Size', 0.0, frame=frame_start)
        style.set_node_input(iris, 'Size', 2.0, frame=frame_end)
    else: # OUT
        style.set_node_input(iris, 'Size', 2.0, frame=frame_start)
        style.set_node_input(iris, 'Size', 0.0, frame=frame_end)

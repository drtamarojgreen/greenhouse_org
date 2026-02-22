import bpy
import style_utilities as style

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
    style.set_node_input(glare, 'glare_type', 'FOG_GLOW') # Point 142: Use lower_case for Blender 4.0+
    style.set_node_input(glare, 'Size', 8)
    style.set_node_input(glare, 'Threshold', 0.5)

    # Enhancement #60: Lens Distortion / Chromatic Aberration
    distort = tree.nodes.new('CompositorNodeLensdist')
    distort.name = "ChromaticAberration"
    style.set_node_input(distort, 'distort', 0.0)
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

    # Vignette (Ellipse Mask -> Invert -> Multiply)
    ellipse = tree.nodes.new('CompositorNodeEllipseMask')
    style.set_node_input(ellipse, 'Width', 0.8)
    style.set_node_input(ellipse, 'Height', 0.8)

    invert = tree.nodes.new('CompositorNodeInvert')
    tree.links.new(ellipse.outputs['Mask'], invert.inputs['Color'])

    vig_mix = style.create_mix_node(tree, blend_type='MULTIPLY', data_type='RGBA')
    vig_mix.name = "Vignette"
    fac_v, in1_v, in2_v = style.get_mix_sockets(vig_mix)
    # Point 142: Use robust setter to avoid sequence errors
    if fac_v: style.set_socket_value(fac_v, 0.0) # Invisible by default

    # Enhancement #49: Iris Wipe (Double Multiplicative risk mitigation)
    # Point 142: Use MIX instead of MULTIPLY for the second stage to prevent black crush
    iris = tree.nodes.new('CompositorNodeEllipseMask')
    iris.name = "IrisWipe"
    style.set_node_input(iris, 'Width', 2.0)
    style.set_node_input(iris, 'Height', 2.0)

    iris_mix = style.create_mix_node(tree, blend_type='MIX', data_type='RGBA')
    iris_mix.name = "IrisMix"
    fac_i, in1_i, in2_i = style.get_mix_sockets(iris_mix)
    # in1 is usually the 'Image', in2 is the 'Color' to mix in (Black)
    # Point 142: Use robust setter
    if in2_i: style.set_socket_value(in2_i, (0, 0, 0, 1))
    # Keep iris disabled by default. We only wire the mask during an explicit animated iris transition.
    if fac_i: style.set_socket_value(fac_i, 0.0)

    # Links
    # 1. Main Path
    tree.links.new(render_layers.outputs['Image'], glare.inputs['Image'])
    tree.links.new(glare.outputs['Image'], blur.inputs['Image'])
    tree.links.new(blur.outputs['Image'], bright.inputs['Image'])
    tree.links.new(bright.outputs['Image'], distort.inputs['Image'])
    tree.links.new(distort.outputs['Image'], displace.inputs['Image'])
    
    # Insert Vignette
    tree.links.new(displace.outputs['Image'], in1_v)
    tree.links.new(invert.outputs['Color'], in2_v)

    # Insert Iris Wipe
    tree.links.new(style.get_mix_output(vig_mix), in1_i)

    # 4. Final Output
    tree.links.new(style.get_mix_output(iris_mix), huesat.inputs['Image'])
    tree.links.new(huesat.outputs['Image'], composite.inputs['Image'])

def animate_wet_glass(scene, frame_start, frame_end, strength=10.0):
    """Enhancement #60: Animates wet glass refraction strength."""
    tree = style.get_compositor_node_tree(scene)
    if not tree: return
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
    if not tree: return
    iris = tree.nodes.get("IrisWipe")
    iris_mix = tree.nodes.get("IrisMix")
    if not iris or not iris_mix:
        return

    fac_i, _, _ = style.get_mix_sockets(iris_mix)
    if fac_i:
        # Ensure the factor is driven by the iris mask only for deliberate transition beats.
        for link in list(tree.links):
            if link.to_node == iris_mix and link.to_socket == fac_i:
                tree.links.remove(link)
        tree.links.new(iris.outputs['Mask'], fac_i)

    if mode == 'IN':
        style.set_node_input(iris, 'Width', 0.01, frame=frame_start)
        style.set_node_input(iris, 'Height', 0.01, frame=frame_start)
        style.set_node_input(iris, 'Width', 2.0, frame=frame_end)
        style.set_node_input(iris, 'Height', 2.0, frame=frame_end)
    else: # OUT
        style.set_node_input(iris, 'Width', 2.0, frame=frame_start)
        style.set_node_input(iris, 'Height', 2.0, frame=frame_start)
        style.set_node_input(iris, 'Width', 0.01, frame=frame_end)
        style.set_node_input(iris, 'Height', 0.01, frame=frame_end)

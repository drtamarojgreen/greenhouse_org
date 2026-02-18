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
    composite = tree.nodes.new('CompositorNodeComposite')

    # Enhancement #55: Bloom/Glow for Bioluminescence
    glare = tree.nodes.new('CompositorNodeGlare')
    glare.glare_type = 'FOG_GLOW'
    glare.size = 8
    glare.threshold = 0.5

    # Enhancement #60: Lens Distortion / Chromatic Aberration
    distort = style.setup_chromatic_aberration(scene, strength=0.02)

    # Enhancement #59: Vignette (Breathing)
    vignette = tree.nodes.new('CompositorNodeEllipseMask')
    vignette.name = "Vignette"
    vignette.width = 0.8
    vignette.height = 0.8

    # Mix vignette
    mix_vig = tree.nodes.new('CompositorNodeMixRGB')
    mix_vig.blend_type = 'MULTIPLY'

    # Enhancement #60: Wet Glass Refraction (Displacement)
    tex_noise = tree.nodes.new('CompositorNodeTexture')
    # We need a noise texture datablock
    noise_tex = bpy.data.textures.get("WetGlassNoise") or bpy.data.textures.new("WetGlassNoise", type='NOISE')
    tex_noise.texture = noise_tex

    displace = tree.nodes.new('CompositorNodeDisplace')
    displace.name = "WetGlass"
    displace.inputs[2].default_value = 0.0 # Scale

    # Enhancement #49: Iris Wipe
    iris = tree.nodes.new('CompositorNodeEllipseMask')
    iris.name = "IrisWipe"
    iris.width = 2.0 # Start fully open
    iris.height = 2.0

    mix_iris = tree.nodes.new('CompositorNodeMixRGB')
    mix_iris.blend_type = 'MULTIPLY'

    # Film Grain / Flicker
    style.apply_film_flicker(scene, 1, 15000, strength=0.03)

    # Global Saturation
    style.setup_saturation_control(scene)
    huesat = tree.nodes.get("GlobalSaturation")

    # Links
    tree.links.new(render_layers.outputs['Image'], glare.inputs['Image'])
    tree.links.new(glare.outputs['Image'], displace.inputs[0])
    tree.links.new(tex_noise.outputs[0], displace.inputs[1]) # X
    tree.links.new(tex_noise.outputs[0], displace.inputs[2]) # Y

    tree.links.new(displace.outputs[0], mix_vig.inputs[1])
    tree.links.new(vignette.outputs['Mask'], mix_vig.inputs[2])
    tree.links.new(mix_vig.outputs['Image'], mix_iris.inputs[1])
    tree.links.new(iris.outputs['Mask'], mix_iris.inputs[2])
    tree.links.new(mix_iris.outputs['Image'], huesat.inputs['Image'])
    tree.links.new(huesat.outputs['Image'], composite.inputs['Image'])

def animate_wet_glass(scene, frame_start, frame_end, strength=10.0):
    """Enhancement #60: Animates wet glass refraction strength."""
    tree = style.get_compositor_node_tree(scene)
    displace = tree.nodes.get("WetGlass")
    if not displace: return

    displace.inputs[2].default_value = 0.0
    displace.inputs[2].keyframe_insert(data_path="default_value", frame=frame_start - 12)
    displace.inputs[2].default_value = strength
    displace.inputs[2].keyframe_insert(data_path="default_value", frame=frame_start)
    displace.inputs[2].keyframe_insert(data_path="default_value", frame=frame_end)
    displace.inputs[2].default_value = 0.0
    displace.inputs[2].keyframe_insert(data_path="default_value", frame=frame_end + 12)

def animate_iris_wipe(scene, frame_start, frame_end, mode='IN'):
    """Enhancement #49: Iris Wipe transition animation."""
    tree = style.get_compositor_node_tree(scene)
    iris = tree.nodes.get("IrisWipe")
    if not iris: return

    if mode == 'IN':
        iris.width = 0.0
        iris.height = 0.0
        iris.keyframe_insert(data_path="width", frame=frame_start)
        iris.keyframe_insert(data_path="height", frame=frame_start)
        iris.width = 2.0
        iris.height = 2.0
        iris.keyframe_insert(data_path="width", frame=frame_end)
        iris.keyframe_insert(data_path="height", frame=frame_end)
    else: # OUT
        iris.width = 2.0
        iris.height = 2.0
        iris.keyframe_insert(data_path="width", frame=frame_start)
        iris.keyframe_insert(data_path="height", frame=frame_start)
        iris.width = 0.0
        iris.height = 0.0
        iris.keyframe_insert(data_path="width", frame=frame_end)
        iris.keyframe_insert(data_path="height", frame=frame_end)

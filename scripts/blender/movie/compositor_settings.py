import bpy
import style

def setup_compositor_effects(master):
    """Sets up the compositor tree with filmic effects and wet-lens support."""
    tree = style.get_compositor_node_tree(master.scene)
    if tree is None: return
    for node in tree.nodes: tree.nodes.remove(node)

    rl = tree.nodes.new('CompositorNodeRLayers')
    composite = tree.nodes.new('CompositorNodeComposite')

    if master.mode == 'SILENT_FILM':
        # Point 18: One bright node
        bright = tree.nodes.new('CompositorNodeBrightContrast')
        bright.name = "Bright/Contrast"
        bright.inputs['Contrast'].default_value = 1.3

        style.apply_film_flicker(master.scene, 1, 15000, strength=0.05)
        distort = style.setup_chromatic_aberration(master.scene, strength=0.02)

        # Point 58: Chromatic Shift on Emotional Peak
        distort.inputs['Dispersion'].keyframe_insert(data_path="default_value", frame=12999)
        distort.inputs['Dispersion'].default_value = 0.1
        distort.inputs['Dispersion'].keyframe_insert(data_path="default_value", frame=13000)
        distort.inputs['Dispersion'].default_value = 0.02
        distort.inputs['Dispersion'].keyframe_insert(data_path="default_value", frame=13012)

        huesat = style.setup_saturation_control(master.scene)
        blur = style.apply_glow_trails(master.scene)

        # Point 55: Bloom Glow on Plant Emissions
        glare = tree.nodes.new('CompositorNodeGlare')
        glare.glare_type = 'BLOOM'
        glare.threshold = 0.5

        # Point 53: Lens Flare
        flare = tree.nodes.new('CompositorNodeGlare')
        flare.glare_type = 'GHOSTS'

        # Point 60: Glass Refraction
        refract = tree.nodes.new('CompositorNodeLensdist')
        refract.inputs['Distort'].default_value = 0.01

        # Connect nodes
        tree.links.new(rl.outputs['Image'], huesat.inputs['Image'])
        tree.links.new(huesat.outputs['Image'], glare.inputs['Image'])
        tree.links.new(glare.outputs['Image'], flare.inputs['Image'])
        tree.links.new(flare.outputs['Image'], blur.inputs['Image'])
        tree.links.new(blur.outputs['Image'], refract.inputs['Image'])
        tree.links.new(refract.outputs['Image'], distort.inputs['Image'])
        tree.links.new(distort.outputs['Image'], bright.inputs['Image'])
        tree.links.new(bright.outputs['Image'], composite.inputs['Image'])

        # Point 101: Setup wet lens if rain is present (will be called from master if needed)
    else:
        tree.links.new(rl.outputs['Image'], composite.inputs['Image'])

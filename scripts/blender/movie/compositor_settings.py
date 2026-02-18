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
        huesat = style.setup_saturation_control(master.scene)
        blur = style.apply_glow_trails(master.scene)

        # Connect nodes
        tree.links.new(rl.outputs['Image'], huesat.inputs['Image'])
        tree.links.new(huesat.outputs['Image'], blur.inputs['Image'])
        tree.links.new(blur.outputs['Image'], distort.inputs['Image'])
        tree.links.new(distort.outputs['Image'], bright.inputs['Image'])
        tree.links.new(bright.outputs['Image'], composite.inputs['Image'])

        # Point 101: Setup wet lens if rain is present (will be called from master if needed)
    else:
        tree.links.new(rl.outputs['Image'], composite.inputs['Image'])

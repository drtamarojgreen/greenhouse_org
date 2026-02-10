import bpy
import mathutils
import random
import style

def setup_scene(master):
    """The Synaptic Bridge."""
    master.create_intertitle("The Bridge of\nConnectivity", 1501, 1600)

    # Scene range: 1601 - 1800
    start_f = 1601
    end_f = 1800

    style.apply_scene_grade(master, 'resonance', start_f, end_f)

    # Create multiple Nodes
    node_locs = [
        mathutils.Vector((8, 2, 2)),
        mathutils.Vector((12, -2, 4)),
        mathutils.Vector((10, 5, 0)),
        mathutils.Vector((15, 0, 1)),
        mathutils.Vector((12, 3, -2))
    ]

    nodes = []
    mat_node = bpy.data.materials.new(name="BridgeNodeMat")
    mat_node.use_nodes = True
    bsdf = mat_node.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.2, 0.4, 1.0, 1)
    bsdf.inputs["Emission Strength"].default_value = 5.0

    for i, loc in enumerate(node_locs):
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.15, location=loc)
        node = bpy.context.object
        node.name = f"SynapticNode_{i}"
        node.data.materials.append(mat_node)

        node.hide_render = True
        node.keyframe_insert(data_path="hide_render", frame=start_f - 1)
        node.hide_render = False
        node.keyframe_insert(data_path="hide_render", frame=start_f)
        node.hide_render = True
        node.keyframe_insert(data_path="hide_render", frame=end_f)
        nodes.append(node)

        # Synaptic Heartbeat
        style.animate_pulsing_emission(node, start_f, end_f, base_strength=5.0, pulse_amplitude=10.0, cycle=64)

    style.apply_fade_transition(nodes, start_f, end_f, mode='IN', duration=12)

    # Create Sparks
    for i in range(15):
        n1 = random.choice(nodes); n2 = random.choice(nodes)
        if n1 == n2: continue
        s_time = random.randint(start_f, end_f - 20)
        master.create_thought_spark(n1.location, n2.location, s_time, s_time + 20)

    if master.neuron:
        master.neuron.location = mathutils.Vector((5, 0, 2))
        master.neuron.keyframe_insert(data_path="location", frame=start_f)
        master.neuron.location = mathutils.Vector((10, 0, 2))
        master.neuron.keyframe_insert(data_path="location", frame=end_f)

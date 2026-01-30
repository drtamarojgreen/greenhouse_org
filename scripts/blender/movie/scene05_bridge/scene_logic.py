import bpy
import mathutils
import random

def setup_scene(master):
    """The Synaptic Bridge."""
    master.create_intertitle("The Bridge of\nConnectivity", 1501, 1600)

    # Scene range: 1601 - 1800
    start_f = 1601
    end_f = 1800

    # Create multiple Nodes (Representing Synaptic junctions)
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
    mat_node.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.2, 0.4, 1.0, 1)
    mat_node.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 2.0

    for i, loc in enumerate(node_locs):
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.15, location=loc)
        node = bpy.context.object
        node.name = f"SynapticNode_{i}"
        node.data.materials.append(mat_node)

        # Visibility
        node.hide_render = True
        node.keyframe_insert(data_path="hide_render", frame=start_f - 1)
        node.hide_render = False
        node.keyframe_insert(data_path="hide_render", frame=start_f)
        node.hide_render = True
        node.keyframe_insert(data_path="hide_render", frame=end_f)
        nodes.append(node)

    # Create Sparks traveling between nodes
    for i in range(10):
        n1 = random.choice(nodes)
        n2 = random.choice(nodes)
        if n1 == n2: continue

        s_time = random.randint(start_f, end_f - 20)
        e_time = s_time + 20
        master.create_thought_spark(n1.location, n2.location, s_time, e_time)

    # Move the main Neuron into the bridge area
    if master.neuron:
        master.neuron.location = mathutils.Vector((5, 0, 2))
        master.neuron.keyframe_insert(data_path="location", frame=start_f)
        master.neuron.location = mathutils.Vector((10, 0, 2))
        master.neuron.keyframe_insert(data_path="location", frame=end_f)

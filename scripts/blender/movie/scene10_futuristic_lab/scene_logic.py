import bpy
import mathutils
import futuristic_props

def setup_scene(master):
    """The Digital Mirror - Futuristic Lab scene."""
    master.create_intertitle("The Digital Mirror", 3501, 3600)

    # Lab Assets
    bench = futuristic_props.create_lab_bench(mathutils.Vector((0, 0, 0)))
    holo = futuristic_props.create_hologram(mathutils.Vector((0, 0, 0)))

    # Visibility
    for obj in [bench, holo]:
        obj.hide_render = True
        obj.keyframe_insert(data_path="hide_render", frame=3600)
        obj.hide_render = False
        obj.keyframe_insert(data_path="hide_render", frame=3601)
        obj.hide_render = True
        obj.keyframe_insert(data_path="hide_render", frame=3801)

    # Characters observation
    if master.h1:
        master.h1.location = (0, -2, 0)
        master.h1.keyframe_insert(data_path="location", frame=3601)
        master.h1.rotation_euler = (0, 0, 0)
        master.h1.keyframe_insert(data_path="rotation_euler", frame=3601)

    # Studying the Neuron in the lab
    if master.neuron:
        master.neuron.location = (0, 0, 1.5)
        master.neuron.keyframe_insert(data_path="location", frame=3601)
        master.neuron.hide_render = False
        master.neuron.keyframe_insert(data_path="hide_render", frame=3601)
        master.neuron.hide_render = True
        master.neuron.keyframe_insert(data_path="hide_render", frame=3801)

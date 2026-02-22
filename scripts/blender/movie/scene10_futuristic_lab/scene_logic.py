import bpy
import mathutils
from assets import futuristic_props

def setup_scene(master):
    """
    The Digital Mirror - Futuristic Lab scene.
    Shot ID: S10
    Intent: Introspection and analysis through technology.
    """
    # MUSIC CUE: Bubbling, rhythmic synth sequences.
    # Point 142: Correct frame range (2801 - 3300)
    from constants import SCENE_MAP
    start_f, end_f = SCENE_MAP['scene10_futuristic_lab']
    master.create_intertitle("The Digital Mirror", start_f, start_f + 100)

    # Lab Assets
    bench = futuristic_props.create_lab_bench(mathutils.Vector((0, 0, 0)))
    holo = futuristic_props.create_hologram(mathutils.Vector((0, 0, 0)))

    # Visibility
    for obj in [bench, holo]:
        import style_utilities as style
        style.set_obj_visibility(obj, False, start_f - 1)
        style.set_obj_visibility(obj, True, start_f)
        style.set_obj_visibility(obj, False, end_f + 1)

    # Characters observation
    if master.h1:
        master.place_character(master.h1, (0, -2, 0), (0, 0, 0), start_f)
        master.hold_position(master.h1, start_f, end_f)

    # Studying the Neuron in the lab
    if master.neuron:
        master.neuron.location = (0, 0, 1.5)
        master.neuron.keyframe_insert(data_path="location", frame=start_f)
        import style_utilities as style
        style.set_obj_visibility(master.neuron, True, start_f)
        style.set_obj_visibility(master.neuron, False, end_f + 1)

    # Point 142: Pull CamTarget to neuron focus
    target = bpy.data.objects.get("CamTarget")
    if target:
        target.location = (0, 0, 1.5)
        target.keyframe_insert(data_path="location", frame=start_f)

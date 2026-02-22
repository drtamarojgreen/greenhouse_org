import bpy
import math

def setup_scene(master):
    """
    The Confrontation between Plants and Gnome.
    Shot ID: S08
    Intent: Peak narrative tension.
    """
    # MUSIC CUE: Tense, staccato violins.
    # Point 142: Correct frame range (2101 - 2500)
    from constants import SCENE_MAP
    start_f, end_f = SCENE_MAP['scene08_confrontation']

    # Plants reaction
    if master.h1:
        master.place_character(master.h1, (-1, 0, 0), (0, 0, 0), start_f)

        # Crouch (Scale Z)
        master.h1.scale.z = 0.8
        master.h1.keyframe_insert(data_path="scale", index=2, frame=start_f + 100)

        master.h1.rotation_euler = (0, math.radians(10), 0)
        master.h1.keyframe_insert(data_path="rotation_euler", frame=start_f + 100)

        master.h1.scale.z = 1.0
        master.h1.keyframe_insert(data_path="scale", index=2, frame=end_f)
        master.h1.rotation_euler = (0, 0, 0)
        master.h1.keyframe_insert(data_path="rotation_euler", frame=end_f)

    # The master handles camera (2101-2500 is one shot currently)
    pass

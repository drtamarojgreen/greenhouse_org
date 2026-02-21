import bpy
import math
from constants import SCENE_MAP

def setup_scene(master):
    """
    The Confrontation between Plants and Gnome.
    Shot ID: S08
    Intent: Peak narrative tension.
    """
    # MUSIC CUE: Tense, staccato violins.
    if 'scene08_confrontation' not in SCENE_MAP: return
    start_frame, end_frame = SCENE_MAP['scene08_confrontation']
    mid_frame = (start_frame + end_frame) // 2

    # Plants reaction
    if master.h1:
        master.h1.rotation_euler = (0, 0, 0)
        master.h1.keyframe_insert(data_path="rotation_euler", frame=start_frame)

        # Crouch (Scale Z)
        master.h1.scale.z = 0.8
        master.h1.keyframe_insert(data_path="scale", frame=mid_frame)

        master.h1.rotation_euler = (0, math.radians(10), 0)
        master.h1.keyframe_insert(data_path="rotation_euler", frame=mid_frame)

        master.h1.scale.z = 1.0
        master.h1.keyframe_insert(data_path="scale", frame=end_frame)
        master.h1.rotation_euler = (0, 0, 0)
        master.h1.keyframe_insert(data_path="rotation_euler", frame=end_frame)

    # The master handles camera (2101-2500 is one shot currently)
    pass

import bpy
import math

def setup_scene(master):
    """The Confrontation between Plants and Gnome."""
    # Plants reaction
    if master.h1:
        master.h1.rotation_euler = (0, 0, 0)
        master.h1.keyframe_insert(data_path="rotation_euler", frame=2301)
        master.h1.rotation_euler = (0, math.radians(10), 0)
        master.h1.keyframe_insert(data_path="rotation_euler", frame=2400)
        master.h1.rotation_euler = (0, 0, 0)
        master.h1.keyframe_insert(data_path="rotation_euler", frame=2500)

    # The master handles camera (2101-2500 is one shot currently)
    pass

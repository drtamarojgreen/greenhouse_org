import bpy
import math

def setup_scene(master):
    """The Resonance of Logos and Finale."""
    master.create_intertitle("The Resonance of\nLogos", 2901, 3000)

    # Intensify lights to dispel gloom
    sun = bpy.data.objects.get("Sun")
    if sun:
        sun.data.energy = 2.0
        sun.data.keyframe_insert(data_path="energy", frame=3000)
        sun.data.energy = 15.0
        sun.data.keyframe_insert(data_path="energy", frame=3150)
        sun.data.energy = 2.0
        sun.data.keyframe_insert(data_path="energy", frame=3300)

    # Characters pose in triumph
    if master.h1:
        master.h1.rotation_euler = (0, 0, 0)
        master.h1.keyframe_insert(data_path="rotation_euler", frame=3001)
        master.h1.rotation_euler = (math.radians(-10), 0, 0)
        master.h1.keyframe_insert(data_path="rotation_euler", frame=3150)

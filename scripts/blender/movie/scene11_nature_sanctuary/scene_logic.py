import bpy
import mathutils
import random
import plant_humanoid

def setup_scene(master):
    """The Sanctuary of Stillness - Naturalistic scene."""
    master.create_intertitle("The Sanctuary of\nStillness", 3801, 3900)

    # Dense Foliage
    bushes = []
    for i in range(10):
        loc = mathutils.Vector((random.uniform(-10, 10), random.uniform(-10, 10), 0))
        b = plant_humanoid.create_procedural_bush(loc, name=f"SanctuaryBush_{i}", size=random.uniform(0.5, 2.0))
        bushes.append(b)

    # Visibility
    for b in bushes:
        for obj in b.objects:
            obj.hide_render = True
            obj.keyframe_insert(data_path="hide_render", frame=3900)
            obj.hide_render = False
            obj.keyframe_insert(data_path="hide_render", frame=3901)
            obj.hide_render = True
            obj.keyframe_insert(data_path="hide_render", frame=4101)

    # Peaceful characters
    if master.h1:
        master.h1.location = (0, 0, 0)
        master.h1.keyframe_insert(data_path="location", frame=3901)
        master.h1.rotation_euler = (0, 0, 0)
        master.h1.keyframe_insert(data_path="rotation_euler", frame=3901)

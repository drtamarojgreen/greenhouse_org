import bpy
import mathutils
import random
import plant_humanoid
import style

def setup_scene(master):
    """The Sanctuary of Stillness - Naturalistic scene."""
    master.create_intertitle("The Sanctuary of\nStillness", 3801, 3900)

    # Apply sanctuary grade
    style.apply_scene_grade(master, 'sanctuary', 3901, 4100)

    # Dense Foliage
    bushes = []
    for i in range(10):
        loc = mathutils.Vector((random.uniform(-10, 10), random.uniform(-10, 10), 0))
        b = plant_humanoid.create_procedural_bush(loc, name=f"SanctuaryBush_{i}", size=random.uniform(0.5, 2.0))
        bushes.append(b)

    # Visibility and Wind
    for b in bushes:
        for obj in b.objects:
            obj.hide_render = True
            obj.keyframe_insert(data_path="hide_render", frame=3900)
            obj.hide_render = False
            obj.keyframe_insert(data_path="hide_render", frame=3901)
            obj.hide_render = True
            obj.keyframe_insert(data_path="hide_render", frame=4101)

        # Apply wind animation
        style.animate_foliage_wind(b.objects, strength=0.04, frame_start=3901, frame_end=4100)

    # Peaceful characters
    if master.h1:
        master.h1.location = (0, 0, 0)
        master.h1.keyframe_insert(data_path="location", frame=3901)
        master.h1.rotation_euler = (0, 0, 0)
        master.h1.keyframe_insert(data_path="rotation_euler", frame=3901)

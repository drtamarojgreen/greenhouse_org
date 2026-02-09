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
    style.animate_dust_particles(mathutils.Vector((0, 0, 2)), density=40, frame_start=3901, frame_end=4100)

    # Dense Foliage
    bushes = []
    for i in range(10):
        loc = mathutils.Vector((random.uniform(-10, 10), random.uniform(-10, 10), 0))
        b = plant_humanoid.create_procedural_bush(loc, name=f"SanctuaryBush_{i}", size=random.uniform(0.5, 2.0))
        bushes.append(b)

    # Visibility and Transitions
    for b in bushes:
        for obj in b.objects:
            obj.hide_render = True
            obj.keyframe_insert(data_path="hide_render", frame=3900)
            obj.hide_render = False
            obj.keyframe_insert(data_path="hide_render", frame=3901)
            obj.hide_render = True
            obj.keyframe_insert(data_path="hide_render", frame=4101)

        style.apply_fade_transition(b.objects, 3901, 4100, mode='IN', duration=20)
        style.animate_foliage_wind(b.objects, strength=0.04, frame_start=3901, frame_end=4100)

    # Peaceful characters
    for char in [master.h1, master.h2]:
        if not char: continue
        style.insert_looping_noise(char, "rotation_euler", index=2, strength=0.03, scale=20.0, frame_start=3901, frame_end=4100)
        style.animate_breathing(char, 3901, 4100, amplitude=0.01)

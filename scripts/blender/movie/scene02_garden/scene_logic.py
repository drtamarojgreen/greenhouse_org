import bpy
import math
import style
import plant_humanoid
import mathutils
import random

def setup_scene(master):
    """The Garden of the Mind setup."""
    master.create_intertitle("The Garden of\nThe Mind", 401, 500)

    # Apply scene grade
    style.apply_scene_grade(master, 'garden', 401, 650)

    # Add extra foliage for vibrancy
    bushes = []
    random.seed(42) # Deterministic for this scene
    for i in range(5):
        loc = mathutils.Vector((random.uniform(-5, 5), random.uniform(0, 5), 0))
        b = plant_humanoid.create_procedural_bush(loc, name=f"GardenBush_{i}", size=random.uniform(0.8, 1.5))
        bushes.append(b)

    # Visibility and Wind
    for b in bushes:
        for obj in b.objects:
            obj.hide_render = True
            obj.keyframe_insert(data_path="hide_render", frame=500)
            obj.hide_render = False
            obj.keyframe_insert(data_path="hide_render", frame=501)
            obj.hide_render = True
            obj.keyframe_insert(data_path="hide_render", frame=651)

        # Apply wind animation
        style.animate_foliage_wind(b.objects, strength=0.03, frame_start=501, frame_end=650)

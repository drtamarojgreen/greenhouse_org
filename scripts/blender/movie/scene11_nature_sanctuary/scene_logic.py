import bpy
import math
import mathutils
import random
from assets import plant_humanoid
import style_utilities as style

def setup_scene(master):
    """
    The Sanctuary of Stillness - Naturalistic scene.
    Shot ID: S11
    Intent: Reconnection with nature and recovery.
    """
    import math
    # MUSIC CUE: Gentle birdsong and pastoral flute.
    # Point 142: Fix frame range to match SCENE_MAP (3301-3800)
    start_frame, end_frame = 3301, 3800
    master.create_intertitle("The Sanctuary of\nStillness", start_frame, start_frame + 100)

    # Apply sanctuary grade
    style.apply_scene_grade(master, 'sanctuary', start_frame, end_frame)
    style.animate_dust_particles(mathutils.Vector((0, 0, 2)), density=40, frame_start=start_frame, frame_end=end_frame)

    # Dense Foliage
    bushes = []
    for i in range(10):
        loc = mathutils.Vector((random.uniform(-10, 10), random.uniform(-10, 10), 0))
        b = plant_humanoid.create_procedural_bush(loc, name=f"SanctuaryBush_{i}", size=random.uniform(0.5, 2.0))
        bushes.append(b)

    # Visibility and Transitions
    for b in bushes:
        # BMesh bushes are single objects
        objs_to_animate = [b]
        for obj in objs_to_animate:
            style.set_obj_visibility(obj, False, start_frame - 1)
            style.set_obj_visibility(obj, True, start_frame)
            style.set_obj_visibility(obj, False, end_frame + 1)

            # Time-Lapse Growth (Scale 0 to 1)
            obj.scale = (0.01, 0.01, 0.01)
            obj.keyframe_insert(data_path="scale", frame=start_frame)
            obj.scale = (1, 1, 1)
            obj.keyframe_insert(data_path="scale", frame=end_frame)

        style.apply_fade_transition(objs_to_animate, start_frame, end_frame, mode='IN', duration=20)
        style.animate_foliage_wind(objs_to_animate, strength=0.04, frame_start=start_frame, frame_end=end_frame)

    # Falling Petals
    style.animate_dust_particles(mathutils.Vector((0, 0, 5)), color=(1, 0.8, 0.9, 1), density=20, frame_start=start_frame, frame_end=end_frame)

    # Atmospheric Fauna (Glow-bugs)
    # Point 49: Distinct firefly behavior
    style.animate_fireflies(mathutils.Vector((0, 0, 1)), density=15, frame_start=start_frame, frame_end=end_frame)

    # Peaceful characters - and POSITION them (Point 142)
    if master.h1 and master.h2:
        master.place_character(master.h1, (-1, -1, 0), (0, 0, math.radians(10)), start_frame)
        master.place_character(master.h2, (1, -1, 0), (0, 0, math.radians(-10)), start_frame)
        master.hold_position(master.h1, start_frame, end_frame)
        master.hold_position(master.h2, start_frame, end_frame)

    for char in [master.h1, master.h2]:
        if not char: continue
        style.insert_looping_noise(char, "rotation_euler", index=2, strength=0.03, scale=20.0, frame_start=start_frame, frame_end=end_frame)
        style.animate_breathing(char, start_frame, end_frame, amplitude=0.01)

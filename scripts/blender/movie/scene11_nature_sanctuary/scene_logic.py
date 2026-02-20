import bpy
import mathutils
import random
from assets import plant_humanoid
from assets import plant_humanoid
from constants import SCENE_MAP
import style

def setup_scene(master):
    """
    The Sanctuary of Stillness - Naturalistic scene.
    Shot ID: S11
    Intent: Reconnection with nature and recovery.
    """
    # MUSIC CUE: Gentle birdsong and pastoral flute.
    start_frame, end_frame = SCENE_MAP['scene11_nature_sanctuary']
    title_end = start_frame + 99
    action_start = start_frame + 100

    master.create_intertitle("The Sanctuary of\nStillness", start_frame, title_end)

    # Apply sanctuary grade
    style.apply_scene_grade(master, 'sanctuary', action_start, end_frame)
    style.animate_dust_particles(mathutils.Vector((0, 0, 2)), density=40, frame_start=action_start, frame_end=end_frame)

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
            obj.hide_render = True
            obj.keyframe_insert(data_path="hide_render", frame=action_start - 1)
            obj.hide_render = False
            obj.keyframe_insert(data_path="hide_render", frame=action_start)
            obj.hide_render = True
            obj.keyframe_insert(data_path="hide_render", frame=end_frame)

            # Time-Lapse Growth (Scale 0 to 1)
            obj.scale = (0.01, 0.01, 0.01)
            obj.keyframe_insert(data_path="scale", frame=action_start)
            obj.scale = (1, 1, 1)
            obj.keyframe_insert(data_path="scale", frame=end_frame)

        style.apply_fade_transition(objs_to_animate, action_start, end_frame, mode='IN', duration=20)
        style.animate_foliage_wind(objs_to_animate, strength=0.04, frame_start=action_start, frame_end=end_frame)

    # Falling Petals
    style.animate_dust_particles(mathutils.Vector((0, 0, 5)), color=(1, 0.8, 0.9, 1), density=20, frame_start=action_start, frame_end=end_frame)

    # Atmospheric Fauna (Glow-bugs)
    # Point 49: Distinct firefly behavior
    style.animate_fireflies(mathutils.Vector((0, 0, 1)), density=15, frame_start=action_start, frame_end=end_frame)

    # Peaceful characters
    for char in [master.h1, master.h2]:
        if not char: continue
        style.insert_looping_noise(char, "rotation_euler", index=2, strength=0.03, scale=20.0, frame_start=action_start, frame_end=end_frame)
        style.animate_breathing(char, action_start, end_frame, amplitude=0.01)

import bpy
import math
import random
import os
import sys
import mathutils

# Ensure assets are importable
MOVIE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_PATH = os.path.join(MOVIE_ROOT, "assets")
if ASSETS_PATH not in sys.path:
    sys.path.append(ASSETS_PATH)

from assets import plant_humanoid
import style_utilities as style
from constants import SCENE_MAP

def setup_scene(master):
    """
    Retreat scene 22.
    Shot ID: S22_01
    Intent: Antagonist flees. Handoff to credits.
    """
    # Point 31: Use SCENE_MAP
    start_frame, end_frame = SCENE_MAP['scene22_retreat']

    if not master.gnome:
        return

    # Metadata
    # Shot ID: S22_01
    # Intent: Antagonist flees. Handoff to credits.

    # Antagonist emotional degradation
    style.animate_expression_blend("GloomGnome", start_frame, expression='SURPRISED')

    # Retreat locomotion
    # 1. Shock and stumble (13701 - 13850)
    style.animate_gnome_stumble(master.gnome, start_frame + 20)
    style.animate_gnome_stumble(master.gnome, start_frame + 80)
    style.insert_looping_noise(master.gnome, "location", strength=0.1, scale=0.5, frame_start=start_frame, frame_end=start_frame+100)

    # 2. Turn and hesitate (13851 - 14000)
    master.gnome.rotation_euler[2] = 0
    master.gnome.keyframe_insert(data_path="rotation_euler", index=2, frame=start_frame + 150)
    master.gnome.rotation_euler[2] = math.radians(135)
    master.gnome.keyframe_insert(data_path="rotation_euler", index=2, frame=start_frame + 200)

    # 3. Sprint away with speed ramp (14001 - 14500)
    master.gnome.location.x = 4
    master.gnome.location.y = 4
    master.gnome.keyframe_insert(data_path="location", frame=start_frame + 300)

    # Exponential-ish sprint
    master.gnome.location.x = 30
    master.gnome.location.y = 30
    master.gnome.keyframe_insert(data_path="location", frame=end_frame - 50)
    style.ease_action(master.gnome, "location", index=0, interpolation='BEZIER', easing='EASE_IN')
    style.ease_action(master.gnome, "location", index=1, interpolation='BEZIER', easing='EASE_IN')

    # Final off-screen state
    master.gnome.hide_render = False
    master.gnome.keyframe_insert(data_path="hide_render", frame=end_frame - 51)
    master.gnome.hide_render = True
    master.gnome.keyframe_insert(data_path="hide_render", frame=end_frame - 50)

    # Camera choreography for retreat handled in camera_controls.py

    # Fix C: Coordinate the retreat with a plant pursuit (Point 105)
    if master.h1 and master.h2:
        s22_start = start_frame

        # Plants step forward triumphantly as gnome breaks
        master.h1.location = (-1, 2, 0)
        master.h1.keyframe_insert(data_path="location", frame=s22_start)
        master.h1.location = (0, 4, 0)       # advance toward where gnome was
        master.h1.keyframe_insert(data_path="location", frame=s22_start + 200)

        master.h2.location = (1, 2, 0)
        master.h2.keyframe_insert(data_path="location", frame=s22_start)
        master.h2.location = (2, 4, 0)
        master.h2.keyframe_insert(data_path="location", frame=s22_start + 200)

        # Plants scale back to normal after gnome is gone - dominance was never their nature
        for char in [master.h1, master.h2]:
            char.scale = (1.2, 1.2, 1.2)
            char.keyframe_insert(data_path="scale", frame=s22_start)
            char.scale = (1.0, 1.0, 1.0)
            char.keyframe_insert(data_path="scale", frame=s22_start + 400)

        # Victory pose - both characters face camera and hold still
        for char in [master.h1, master.h2]:
            char.rotation_euler[2] = 0
            char.keyframe_insert(data_path="rotation_euler", index=2, frame=s22_start + 300)

        # After gnome disappears off screen, plants return to peaceful positions
        master.h1.location = (-2, 0, 0)
        master.h1.keyframe_insert(data_path="location", frame=end_frame - 200)
        master.h2.location = (2, 0, 0)
        master.h2.keyframe_insert(data_path="location", frame=end_frame - 200)

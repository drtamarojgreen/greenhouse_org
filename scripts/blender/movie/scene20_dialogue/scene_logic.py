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
from scene_utilities import ensure_scene_keyframe


def setup_scene(master):
    """
    Dialogue scene 20.
    Shot ID: S20
    Intent: Culmination of logic.
    """
    # MUSIC CUE: Swelling orchestral theme.
    # Point 31: Use SCENE_MAP
    start_frame, end_frame = SCENE_MAP['scene20_dialogue']

    if not master.h1 or not master.h2 or not master.gnome:
        return

    ensure_scene_keyframe(master, start_frame)

    # Metadata
    # Shot ID: S20_01
    # Intent: The final argument.

    style.animate_dialogue_v2("Herbaceous", start_frame + 24, start_frame + 400, intensity=1.5)
    style.animate_expression_blend("Herbaceous", start_frame + 50, expression='NEUTRAL')

    # Gnome is visibly shaking
    style.insert_looping_noise(master.gnome, "location", strength=0.05, scale=1.0, frame_start=start_frame, frame_end=end_frame)
    style.animate_expression_blend("GloomGnome", start_frame + 100, expression='SURPRISED')

    # Point 142: Gnome continues retreat
    master.gnome.location.x = 3.5
    master.gnome.keyframe_insert(data_path="location", index=0, frame=start_frame)
    master.gnome.location.x = 4.0
    master.gnome.keyframe_insert(data_path="location", index=0, frame=end_frame)

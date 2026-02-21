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
    Dialogue scene 21.
    Shot ID: S21
    Intent: Final agreement/logos.
    """
    # MUSIC CUE: Harmonic resolution theme.
    # Point 31: Use SCENE_MAP
    start_frame, end_frame = SCENE_MAP['scene21_dialogue']

    if not master.h1 or not master.h2 or not master.gnome:
        return

    ensure_scene_keyframe(master, start_frame)

    # Metadata
    # Shot ID: S21_01
    # Intent: Breakthrough. Gnome is defeated by reason.

    style.animate_dialogue_v2("Arbor", start_frame + 24, start_frame + 300, intensity=1.0)
    style.animate_expression_blend("Arbor", start_frame + 50, expression='NEUTRAL')

    # Gnome retreats a few steps
    master.gnome.location.x = 2
    master.gnome.keyframe_insert(data_path="location", index=0, frame=start_frame)
    master.gnome.location.x = 4
    master.gnome.keyframe_insert(data_path="location", index=0, frame=end_frame)
    style.animate_expression_blend("GloomGnome", start_frame + 100, expression='SURPRISED')

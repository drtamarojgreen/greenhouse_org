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
import style
from constants import SCENE_MAP

def setup_scene(master):
    """
    Dialogue scene 17.
    Shot ID: S17
    Intent: Clarification of concepts.
    """
    # MUSIC CUE: Soft harp accompaniment.
    # Point 31: Use SCENE_MAP
    start_frame, end_frame = SCENE_MAP['scene17_dialogue']

    if not master.h1 or not master.h2:
        return

    # Metadata
    # Shot ID: S17_01
    # Intent: Deeper philosophical inquiry.

    style.animate_dialogue_v2(bpy.data.objects.get("Arbor_Mouth"), start_frame + 50, start_frame + 350, intensity=1.2)
    style.animate_reaction_shot("Herbaceous", start_frame + 50, start_frame + 350)

    style.animate_dialogue_v2(bpy.data.objects.get("Herbaceous_Mouth"), start_frame + 400, start_frame + 650, intensity=1.0)
    style.animate_reaction_shot("Arbor", start_frame + 400, start_frame + 650)

    style.animate_expression_blend("Arbor", start_frame + 150, expression='NEUTRAL')
    style.animate_expression_blend("Herbaceous", start_frame + 450, expression='SURPRISED')

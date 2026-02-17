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

import plant_humanoid
import style
from constants import SCENE_MAP

def setup_scene(master):
    """
    Dialogue scene 16.
    Shot ID: S16
    Intent: Intellectual debate continues.
    """
    # MUSIC CUE: Thoughtful woodwinds.
    # Point 31: Use SCENE_MAP
    start_frame, end_frame = SCENE_MAP['scene16_dialogue']

    if not master.h1 or not master.h2:
        return

    # Metadata
    # Shot ID: S16_01
    # Speakers: Herbaceous, Arbor
    # Intent: Intellectual debate continues.

    # Dialogue turn-taking with hold frames
    # Herbaceous speaks
    style.animate_dialogue_v2(bpy.data.objects.get("Herbaceous_Mouth"), start_frame + 24, start_frame + 280, intensity=1.1)
    style.animate_reaction_shot("Arbor", start_frame + 24, start_frame + 280)

    # Hold frame after Herbaceous speaks (280 - 350)

    # Arbor responds
    style.animate_dialogue_v2(bpy.data.objects.get("Arbor_Mouth"), start_frame + 350, start_frame + 600, intensity=0.9)
    style.animate_reaction_shot("Herbaceous", start_frame + 350, start_frame + 600)

    # Hold frame at end (600 - 700)

    # Expression changes
    style.animate_expression_blend("Herbaceous", start_frame + 100, expression='SURPRISED')
    style.animate_expression_blend("Arbor", start_frame + 400, expression='NEUTRAL')

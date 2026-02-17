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
    Dialogue scene 18.
    Shot ID: S18
    Intent: Emotional tension rises as antagonists are discussed.
    """
    # MUSIC CUE: Tense, low string drone.
    # Point 31: Use SCENE_MAP
    start_frame, end_frame = SCENE_MAP['scene18_dialogue']

    if not master.h1 or not master.h2 or not master.gnome:
        return

    # Metadata
    # Shot ID: S18_01
    # Intent: Antagonist enters, feeling the weight of the logic.

    style.animate_dialogue_v2(bpy.data.objects.get("Herbaceous_Mouth"), start_frame + 24, start_frame + 300, intensity=1.1)
    style.animate_reaction_shot("Arbor", start_frame + 24, start_frame + 300)

    # Gnome reacting in background
    style.animate_expression_blend("GloomGnome", start_frame + 100, expression='ANGRY')
    style.animate_gnome_stumble(master.gnome, start_frame + 400)

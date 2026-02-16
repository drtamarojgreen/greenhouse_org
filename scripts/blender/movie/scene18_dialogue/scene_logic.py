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

def setup_scene(master):
    """Dialogue scene 18."""
    # Frame range: 10901 - 11600
    start_frame = 10901
    end_frame = 11600

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

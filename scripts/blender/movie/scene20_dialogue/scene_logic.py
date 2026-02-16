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
    """Dialogue scene 20."""
    # Frame range: 12301 - 13000
    start_frame = 12301
    end_frame = 13000

    if not master.h1 or not master.h2 or not master.gnome:
        return

    # Metadata
    # Shot ID: S20_01
    # Intent: The final argument.

    style.animate_dialogue_v2(bpy.data.objects.get("Herbaceous_Mouth"), start_frame + 24, start_frame + 400, intensity=1.5)
    style.animate_expression_blend("Herbaceous", start_frame + 50, expression='NEUTRAL')

    # Gnome is visibly shaking
    style.insert_looping_noise(master.gnome, "location", strength=0.05, scale=1.0, frame_start=start_frame, frame_end=end_frame)
    style.animate_expression_blend("GloomGnome", start_frame + 100, expression='SURPRISED')

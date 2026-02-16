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
    """Dialogue scene 19."""
    # Frame range: 11601 - 12300
    start_frame = 11601
    end_frame = 12300

    if not master.h1 or not master.h2 or not master.gnome:
        return

    # Metadata
    # Shot ID: S19_01
    # Intent: Tension rises as the Gloom Gnome falters.

    style.animate_dialogue_v2(bpy.data.objects.get("Arbor_Mouth"), start_frame + 24, start_frame + 300, intensity=1.3)
    style.animate_reaction_shot("Herbaceous", start_frame + 24, start_frame + 300)

    style.animate_expression_blend("GloomGnome", start_frame + 200, expression='SURPRISED') # Fear creeping in
    style.animate_blink(bpy.data.objects.get("GloomGnome_Eye_L"), start_frame, end_frame, interval_range=(20, 50))
    style.animate_blink(bpy.data.objects.get("GloomGnome_Eye_R"), start_frame, end_frame, interval_range=(20, 50))

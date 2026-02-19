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
    Dialogue scene 18.
    Shot ID: S18
    Intent: Emotional tension rises as antagonists are discussed.
    """
    # MUSIC CUE: Tense, low string drone.
    # Point 31: Use SCENE_MAP
    start_frame, end_frame = SCENE_MAP['scene18_dialogue']

    if not master.h1 or not master.h2 or not master.gnome:
        return

    # Fix B: Position gnome across from the plants, closer than his escape position (Point 105)
    master.gnome.location = (3, 3, 0)
    master.gnome.keyframe_insert(data_path="location", frame=start_frame)
    master.gnome.scale = (0.6, 0.6, 0.6)
    master.gnome.keyframe_insert(data_path="scale", frame=start_frame)
    # Face the plants (plants are near origin, gnome is at (3,3), so facing toward -X,-Y)
    master.gnome.rotation_euler[2] = math.radians(225)
    master.gnome.keyframe_insert(data_path="rotation_euler", index=2, frame=start_frame)

    # Metadata
    # Shot ID: S18_01
    # Intent: Antagonist enters, feeling the weight of the logic.

    style.animate_dialogue_v2(bpy.data.objects.get("Herbaceous_Mouth"), start_frame + 24, start_frame + 300, intensity=1.1)
    style.animate_reaction_shot("Arbor", start_frame + 24, start_frame + 300)

    # Gnome reacting in background
    style.animate_expression_blend("GloomGnome", start_frame + 100, expression='ANGRY')
    style.animate_gnome_stumble(master.gnome, start_frame + 400)

    # Fix A: Plants move toward the gnome as their argument intensifies (Point 105)
    style.animate_plant_advance(master, start_frame, end_frame)

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
    Dialogue scene 19.
    Shot ID: S19
    Intent: Seeking resolution.
    """
    # MUSIC CUE: Hopeful strings.
    # Point 31: Use SCENE_MAP
    start_frame, end_frame = SCENE_MAP['scene19_dialogue']

    if not master.h1 or not master.h2 or not master.gnome:
        return

    # Metadata
    # Shot ID: S19_01
    # Intent: Tension rises as the Gloom Gnome falters.

    style.animate_dialogue_v2("Arbor", start_frame + 24, start_frame + 300, intensity=1.3)
    style.animate_reaction_shot("Herbaceous", start_frame + 24, start_frame + 300)

    style.animate_expression_blend("GloomGnome", start_frame + 200, expression='SURPRISED') # Fear creeping in
    
    # Antagonist blinks
    if master.gnome and master.gnome.type == 'ARMATURE':
        style.animate_blink(master.gnome.pose.bones.get("Eye.L"), start_frame, end_frame, interval_range=(20, 50))
        style.animate_blink(master.gnome.pose.bones.get("Eye.R"), start_frame, end_frame, interval_range=(20, 50))
    else:
        style.animate_blink(bpy.data.objects.get("GloomGnome_Eye_L"), start_frame, end_frame, interval_range=(20, 50))
        style.animate_blink(bpy.data.objects.get("GloomGnome_Eye_R"), start_frame, end_frame, interval_range=(20, 50))

    # Fix A: Plants continue to move toward the gnome as their argument intensifies (Point 105)
    style.animate_plant_advance(master, start_frame, end_frame)

    # Point 142: Gnome starts to retreat incrementally
    master.gnome.location.x = 3.0
    master.gnome.keyframe_insert(data_path="location", index=0, frame=start_frame)
    master.gnome.location.x = 3.5
    master.gnome.keyframe_insert(data_path="location", index=0, frame=end_frame)

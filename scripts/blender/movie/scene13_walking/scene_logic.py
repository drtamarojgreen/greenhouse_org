import bpy
import math
import os
import sys
import random

# Ensure assets are importable
ASSETS_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets")
if ASSETS_PATH not in sys.path:
    sys.path.append(ASSETS_PATH)

from assets import plant_humanoid

def setup_scene(master):
    """
    The Walking Scene for the sequel.
    Shot ID: S13
    Intent: Demonstrate movement and character interaction in motion.
    """
    # MUSIC CUE: Plucky, rhythmic strings.
    # Point 142: Fix frame range to match SCENE_MAP (3801-4100)
    from constants import SCENE_MAP
    frame_start, frame_end = SCENE_MAP['scene13_walking']

    # Animate Herbaceous walking
    if master.h1:
        plant_humanoid.animate_walk(master.h1, frame_start, frame_end)
        # Move forward (Point 142: Use place_character)
        master.place_character(master.h1, (-5, 0, 0), (0, 0, 0), frame_start)
        master.place_character(master.h1, (5, 0, 0), (0, 0, 0), frame_end)

        # Talk while walking
        plant_humanoid.animate_talk(master.h1, frame_start + 100, frame_start + 250)

        # Look around while walking
        for f in range(frame_start, frame_end, 100):
            master.h1.rotation_euler.z = math.radians(random.uniform(-20, 20))
            master.h1.keyframe_insert(data_path="rotation_euler", index=2, frame=f)

        # Expression change
        plant_humanoid.animate_expression(master.h1, frame_start + 50, 'SURPRISED')
        plant_humanoid.animate_expression(master.h1, frame_start + 150, 'NEUTRAL')

    # Animate Arbor walking following
    if master.h2:
        plant_humanoid.animate_walk(master.h2, frame_start, frame_end)
        master.place_character(master.h2, (-8, 1, 0), (0, 0, 0), frame_start)
        master.place_character(master.h2, (2, 1, 0), (0, 0, 0), frame_end)

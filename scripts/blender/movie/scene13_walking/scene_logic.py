import bpy
import math
import os
import sys

# Ensure assets are importable
ASSETS_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets")
if ASSETS_PATH not in sys.path:
    sys.path.append(ASSETS_PATH)

import plant_humanoid

def setup_scene(master):
    """The Walking Scene for the sequel."""
    frame_start = 501
    frame_end = 1500

    # Animate Herbaceous walking
    if master.h1:
        plant_humanoid.animate_walk(master.h1, frame_start, frame_end)
        # Move forward
        master.h1.location.x = -5
        master.h1.keyframe_insert(data_path="location", index=0, frame=frame_start)
        master.h1.location.x = 5
        master.h1.keyframe_insert(data_path="location", index=0, frame=frame_end)

        # Talk while walking
        plant_humanoid.animate_talk(master.h1, frame_start + 200, frame_start + 600)

    # Animate Arbor walking following
    if master.h2:
        plant_humanoid.animate_walk(master.h2, frame_start + 100, frame_end + 100)
        master.h2.location.x = -8
        master.h2.keyframe_insert(data_path="location", index=0, frame=frame_start)
        master.h2.location.x = 2
        master.h2.keyframe_insert(data_path="location", index=0, frame=frame_end)

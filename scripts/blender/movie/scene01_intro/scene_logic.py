import bpy
import math

def setup_scene(master):
    """
    Intro and Stoic Reason titles.
    Shot ID: S01
    Intent: Reveal the greenhouse sanctuary with an establishing dolly shot. (Point 41)
    """
    # MUSIC CUE: Wind chimes and soft strings. (Point 47)
    master.create_intertitle("The Seat of\nStoic Reason", 101, 200)

    # Move characters during intro reveal
    if master.h1 and master.h2:
        master.h1.location.y = -1.0
        master.h1.keyframe_insert(data_path="location", index=1, frame=101)
        master.h1.location.y = 0.0
        master.h1.keyframe_insert(data_path="location", index=1, frame=200)

        master.h2.location.y = -1.0
        master.h2.keyframe_insert(data_path="location", index=1, frame=101)
        master.h2.location.y = 0.0
        master.h2.keyframe_insert(data_path="location", index=1, frame=200)

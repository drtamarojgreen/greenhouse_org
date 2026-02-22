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
        master.place_character(master.h1, (-2, -1, 0), (0, 0, 0), 101)
        master.place_character(master.h1, (-2, 0, 0), (0, 0, 0), 200)
        master.place_character(master.h2, (2, -1, 0), (0, 0, 0), 101)
        master.place_character(master.h2, (2, 0, 0), (0, 0, 0), 200)
        master.hold_position(master.gnome, 101, 200)

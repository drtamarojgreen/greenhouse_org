import bpy
import math
import style_utilities as style
from assets.nature_environments import create_forest_clearing

def setup_scene(master):
    """
    Intro and Stoic Reason titles.
    Shot ID: S01
    Intent: Reveal the greenhouse sanctuary with an establishing dolly shot. (Point 41)
    """
    # MUSIC CUE: Wind chimes and soft strings. (Point 47)
    master.create_intertitle("The Seat of\nStoic Reason", 101, 200)

    # Point 142: Strategic Intro Positioning (Symmetrical framing)
    if master.h1 and master.h2:
        master.place_character(master.h1, (-2.5, -2, 0), (0, 0, 0), 101)
        master.place_character(master.h1, (-1.5, 0, 0), (0, 0, 0), 200)
        master.place_character(master.h2, (2.5, -2, 0), (0, 0, 0), 101)
        master.place_character(master.h2, (1.5, 0, 0), (0, 0, 0), 200)
        master.hold_position(master.gnome, 101, 200)

    clearing = bpy.data.objects.get("ForestClearing") or create_forest_clearing()
    style.set_obj_visibility(clearing, False, 1)
    style.set_obj_visibility(clearing, True, 101)
    style.set_obj_visibility(clearing, False, 201)

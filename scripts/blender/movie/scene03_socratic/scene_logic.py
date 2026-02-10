import bpy
import math

import style

def setup_scene(master):
    """The Socratic Dialogue setup."""
    master.create_intertitle("The Dialectic of\nGrowth", 651, 750)

    # Symbolic Thought Motes
    if master.h1:
        style.apply_thought_motes(master.h1, 751, 950, count=3)
    if master.h2:
        style.apply_thought_motes(master.h2, 751, 950, count=3)

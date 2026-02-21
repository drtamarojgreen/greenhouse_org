import bpy
import math

import style_utilities as style

def setup_scene(master):
    """
    The Socratic Dialogue setup.
    Shot ID: S03
    Intent: Demonstrate philosophical exchange via character posture. (Point 44)
    """
    # MUSIC CUE: Harp and light percussion.
    master.create_intertitle("The Dialectic of\nGrowth", 651, 750)

    # Symbolic Thought Motes
    if master.h1:
        style.apply_thought_motes(master.h1, 751, 950, count=3)
        # Point 39: Reaction shot micro-movements
        style.animate_reaction_shot("Herbaceous", 800, 900)
        # Point 44: Leaning towards H2
        master.h1.rotation_euler[0] = 0
        master.h1.keyframe_insert(data_path="rotation_euler", index=0, frame=751)
        master.h1.rotation_euler[0] = math.radians(10)
        master.h1.keyframe_insert(data_path="rotation_euler", index=0, frame=850)
        master.h1.rotation_euler[0] = 0
        master.h1.keyframe_insert(data_path="rotation_euler", index=0, frame=950)

    if master.h2:
        style.apply_thought_motes(master.h2, 751, 950, count=3)
        # Point 39: Reaction shot micro-movements
        style.animate_reaction_shot("Arbor", 751, 850)
        # Point 82: Individual finger curl for emphasis
        fingers = [c for c in master.h2.children if "Finger" in c.name or "Vine" in c.name]
        style.animate_finger_curl(fingers, 850, 950)
        # Point 44: Leaning towards H1 (offset)
        master.h2.rotation_euler[0] = 0
        master.h2.keyframe_insert(data_path="rotation_euler", index=0, frame=751)
        master.h2.rotation_euler[0] = math.radians(-10)
        master.h2.keyframe_insert(data_path="rotation_euler", index=0, frame=800)
        master.h2.rotation_euler[0] = math.radians(10)
        master.h2.keyframe_insert(data_path="rotation_euler", index=0, frame=900)

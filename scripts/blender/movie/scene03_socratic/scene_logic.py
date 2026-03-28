import bpy
import math

import style_utilities as style
from assets.wilderness_assets import create_proc_terrain, create_proc_rock_formation, create_proc_water_body

def setup_scene(master):
    """
    The Socratic Dialogue setup.
    Shot ID: S03
    Intent: Demonstrate philosophical exchange via character posture. (Point 44)
    """
    # MUSIC CUE: Harp and light percussion.
    master.create_intertitle("The Dialectic of\nGrowth", 651, 750)

    # Zen Rock Garden environment
    terrain_sg = bpy.data.objects.get("Terrain_ZenGarden")
    if not terrain_sg:
        terrain_sg = create_proc_terrain((0, 0, -0.5), size=30.0, type="flat")
        terrain_sg.name = "Terrain_ZenGarden"
    
    pond = bpy.data.objects.get("Pond_ZenGarden")
    if not pond:
        pond = create_proc_water_body((3, 2, -0.3), size=4.0, type="pond")
        pond.name = "Pond_ZenGarden"
    
    import mathutils as _mu
    # Point 142: Strategic Boulder Placement (Symmetrical framing)
    boulder_positions = [(-4, -2, -0.5), (4, -2, -0.5), (0, 8, -0.5)]
    for i, (bx, by, bz) in enumerate(boulder_positions):
        b_name = f"ZenBoulder_{i}"
        if not bpy.data.objects.get(b_name):
            b = create_proc_rock_formation(_mu.Vector((bx, by, bz)), scale=0.85, style_type="smooth")
            b.name = b_name

    # Symbolic Thought Motes
    if master.h1:
        master.place_character(master.h1, (-1, 0, 0), (0, 0, 0), 751)
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
        master.place_character(master.h2, (1, 0, 0), (0, 0, 0), 751)
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

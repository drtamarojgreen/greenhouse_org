import bpy
import math
import random
from assets.wilderness_assets import create_proc_terrain, create_proc_rock_formation, create_proc_water_body

def setup_scene(master):
    """
    The Confrontation between Plants and Gnome.
    Shot ID: S08
    Intent: Peak narrative tension.
    """
    # MUSIC CUE: Tense, staccato violins.
    # Point 142: Correct frame range (2101 - 2500)
    from constants import SCENE_MAP
    start_f, end_f = SCENE_MAP['scene08_confrontation']

    # Coastal cliff environment
    if not bpy.data.objects.get("Terrain_CoastalCliff"):
        cliff = create_proc_terrain((0, 5, 2), size=30.0, type="hill")
        cliff.name = "Terrain_CoastalCliff"
        # Jagged coastal rocks framing the cliff edge
        for i in range(6):
            r = create_proc_rock_formation(
                (random.uniform(-8, 8), random.uniform(0, 4), random.uniform(0, 3)),
                scale=random.uniform(1.5, 3.5), style_type="jagged")
            r.name = f"CoastalRock_{i}"
        # Ocean stretching to the horizon
        ocean = create_proc_water_body((0, -20, -4), size=60.0, type="pond")
        ocean.name = "CoastalOcean"
    
    # Plants reaction
    if master.h1:
        master.place_character(master.h1, (-1, 0, 0), (0, 0, 0), start_f)
        
        # Crouch (Scale Z)
        master.h1.scale.z = 0.8
        master.h1.keyframe_insert(data_path="scale", index=2, frame=start_f + 100)

        master.h1.rotation_euler = (0, math.radians(10), 0)
        master.h1.keyframe_insert(data_path="rotation_euler", frame=start_f + 100)

        master.h1.scale.z = 1.0
        master.h1.keyframe_insert(data_path="scale", index=2, frame=end_f)
        master.h1.rotation_euler = (0, 0, 0)
        master.h1.keyframe_insert(data_path="rotation_euler", frame=end_f)

    # The master handles camera (2101-2500 is one shot currently)
    pass

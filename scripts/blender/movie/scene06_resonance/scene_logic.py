import bpy
import math
import style_utilities as style

def setup_scene(master):
    """
    The Resonance of Logos synchronization.
    Shot ID: S06
    Intent: Peak emotional and intellectual synergy.
    """
    # MUSIC CUE: Triumphant orchestral climax.
    # Point 142: Correct frame range (1501 - 1800)
    from constants import SCENE_MAP
    start_f, end_f = SCENE_MAP['scene06_resonance']
    master.create_intertitle("The Resonance of\nLogos", start_f, start_f + 100)

    peak_f = (start_f + end_f) // 2

    style.apply_scene_grade(master, 'resonance', start_f, end_f)

    # Intensify all lights to peak
    # Point 142: Use new light rig names
    for light_name in ["Sun", "DomeFill", "HerbaceousKeyLight", "ArborKeyLight", "LightShaftBeam"]:
        light = bpy.data.objects.get(light_name)
        if not light: continue
        base_energy = light.data.energy
        light.data.keyframe_insert(data_path="energy", frame=start_f)
        light.data.energy = base_energy * 6.0
        light.data.keyframe_insert(data_path="energy", frame=peak_f)
        light.data.energy = base_energy
        light.data.keyframe_insert(data_path="energy", frame=end_f)

    # Characters pose in triumph (Point 142: Position them)
    if master.h1 and master.h2:
        master.place_character(master.h1, (-1, 0, 0), (0, 0, 0), start_f)
        master.place_character(master.h2, (1, 0, 0), (0, 0, 0), start_f)

    for char in [master.h1, master.h2]:
        if char:
            char.rotation_euler[0] = 0
            char.keyframe_insert(data_path="rotation_euler", frame=start_f, index=0)
            char.rotation_euler[0] = math.radians(-20)
            char.keyframe_insert(data_path="rotation_euler", frame=peak_f, index=0)
            char.rotation_euler[0] = 0
            char.keyframe_insert(data_path="rotation_euler", frame=end_f, index=0)

    mat_iron = bpy.data.materials.get("GH_Iron")
    if mat_iron:
        style.set_principled_socket(mat_iron, 'Emission Strength', 0.0, frame=start_f)
        style.set_principled_socket(mat_iron, 'Emission Strength', 5.0, frame=peak_f)
        style.set_principled_socket(mat_iron, 'Emission Strength', 0.0, frame=end_f)

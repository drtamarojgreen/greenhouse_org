import bpy
import math
import style_utilities as style
from assets.wilderness_assets import create_proc_terrain, create_proc_crystal, create_proc_rock_formation

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

    # Ice cave environment
    if not bpy.data.objects.get("Terrain_IceCave"):
        import random
        cave_floor = create_proc_terrain((0, 0, -1), size=25.0, type="flat")
        cave_floor.name = "Terrain_IceCave"
        # Ice blue material
        for mat in cave_floor.data.materials:
            bsdf = mat.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                bsdf.inputs['Base Color'].default_value = (0.7, 0.9, 1.0, 1)
                bsdf.inputs['Roughness'].default_value = 0.05
                bsdf.inputs['Specular IOR Level'].default_value = 1.0
        # Point 142: Strategic Crystal Grid (Ordered rim lighting)
        crystal_grid_res = [(-6, -6, -0.9), (6, -6, -0.9), (-6, 6, -0.9), (6, 6, -0.9), (0, 8, -0.9), (0, -8, -0.9)]
        for i, loc in enumerate(crystal_grid_res):
            c = create_proc_crystal(loc, scale=2.0)
            c.name = f"IceCrystal_{i}"
        # Enclosing rock walls
        for i in range(6):
            angle = (i / 6) * 2 * 3.1415
            rx = math.cos(angle) * 12
            ry = math.sin(angle) * 12
            rk = create_proc_rock_formation((rx, ry, 0), scale=2.5, style_type="layered")
            rk.name = f"CaveWall_{i}"

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

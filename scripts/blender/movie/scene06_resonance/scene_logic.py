import bpy
import math
import style

def setup_scene(master):
    """The Resonance of Logos synchronization."""
    master.create_intertitle("The Resonance of\nLogos", 2901, 3000)

    # Scene range: 3001 - 3500
    peak_f = 3250

    style.apply_scene_grade(master, 'resonance', 3001, 3500)

    # Intensify all lights to peak at 3250
    for light_name in ["Sun", "FillLight", "RimLight", "Spot"]:
        light = bpy.data.objects.get(light_name)
        if not light: continue
        base_energy = light.data.energy
        light.data.keyframe_insert(data_path="energy", frame=3001)
        light.data.energy = base_energy * 6.0
        light.data.keyframe_insert(data_path="energy", frame=peak_f)
        light.data.energy = base_energy
        light.data.keyframe_insert(data_path="energy", frame=3500)

    # Characters pose in triumph
    for char in [master.h1, master.h2]:
        if char:
            char.rotation_euler[0] = 0
            char.keyframe_insert(data_path="rotation_euler", frame=3001, index=0)
            char.rotation_euler[0] = math.radians(-20)
            char.keyframe_insert(data_path="rotation_euler", frame=peak_f, index=0)
            char.rotation_euler[0] = 0
            char.keyframe_insert(data_path="rotation_euler", frame=3500, index=0)

    mat_iron = bpy.data.materials.get("GH_Iron")
    if mat_iron:
        bsdf = mat_iron.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs["Emission Strength"].default_value = 0.0
            bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=3001)
            bsdf.inputs["Emission Strength"].default_value = 5.0
            bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=peak_f)
            bsdf.inputs["Emission Strength"].default_value = 0.0
            bsdf.inputs["Emission Strength"].keyframe_insert(data_path="default_value", frame=3500)

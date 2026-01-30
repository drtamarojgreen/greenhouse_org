import bpy
import math
import random

def setup_scene(master):
    """The Intrusion of Gloom."""
    master.create_intertitle("The Intrusion of\nGloom", 1801, 1900)

    # Gnome animation and visibility
    gnome = master.gnome
    if gnome:
        gnome.hide_render = True
        gnome.keyframe_insert(data_path="hide_render", frame=2100)
        gnome.hide_render = False
        gnome.keyframe_insert(data_path="hide_render", frame=2101)
        gnome.hide_render = True
        gnome.keyframe_insert(data_path="hide_render", frame=2500)

        # Entrance movement
        gnome.location = (5, 5, 0)
        gnome.keyframe_insert(data_path="location", frame=2101)
        gnome.location = (2, 2, 0)
        gnome.keyframe_insert(data_path="location", frame=2300)
        gnome.location = (2, 2, 0) # Pause
        gnome.keyframe_insert(data_path="location", frame=2500)

    # Characters shiver in suspense
    for char in [master.h1, master.h2]:
        if char:
            base_x = char.location.x
            for f in range(2101, 2500, 4):
                char.location.x = base_x + random.uniform(-0.02, 0.02)
                char.keyframe_insert(data_path="location", frame=f)
            char.location.x = base_x
            char.keyframe_insert(data_path="location", frame=2500)

        # Staff animation
        staff = bpy.data.objects.get("GloomGnome_Staff_Container")
        if staff:
            staff.rotation_euler = (0, 0, 0)
            staff.keyframe_insert(data_path="rotation_euler", frame=2101)
            staff.rotation_euler = (0, math.radians(30), 0)
            staff.keyframe_insert(data_path="rotation_euler", frame=2300)
            staff.rotation_euler = (0, 0, 0)
            staff.keyframe_insert(data_path="rotation_euler", frame=2500)

        # Dim the lights
        for light_name in ["Sun", "FillLight", "RimLight", "Spot"]:
            light = bpy.data.objects.get(light_name)
            if not light: continue
            base_energy = light.data.energy
            light.data.keyframe_insert(data_path="energy", frame=2100)
            light.data.energy = base_energy * 0.1
            light.data.keyframe_insert(data_path="energy", frame=2200)
            light.data.energy = base_energy
            light.data.keyframe_insert(data_path="energy", frame=2600)

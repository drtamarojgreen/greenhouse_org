import bpy
import math

def setup_scene(master):
    """The Intrusion of Gloom."""
    master.create_intertitle("The Intrusion of\nGloom", 1801, 2100)

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

        # Staff animation
        staff = bpy.data.objects.get("GloomGnome_Staff")
        if staff:
            staff.rotation_euler = (0, 0, 0)
            staff.keyframe_insert(data_path="rotation_euler", frame=2101)
            staff.rotation_euler = (0, math.radians(30), 0)
            staff.keyframe_insert(data_path="rotation_euler", frame=2300)
            staff.rotation_euler = (0, 0, 0)
            staff.keyframe_insert(data_path="rotation_euler", frame=2500)

        # Dim the lights
        sun = bpy.data.objects.get("Sun")
        if sun:
            sun.data.energy = 2.0
            sun.data.keyframe_insert(data_path="energy", frame=2100)
            sun.data.energy = 0.2
            sun.data.keyframe_insert(data_path="energy", frame=2200)
            sun.data.energy = 2.0
            sun.data.keyframe_insert(data_path="energy", frame=2600)

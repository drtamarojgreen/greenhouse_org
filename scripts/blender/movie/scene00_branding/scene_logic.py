import bpy
import math
import style

def setup_scene(master):
    """Intro Branding Scene."""
    # Frame range: 1 - 100
    master.create_intertitle("GreenhouseMD\nPresents", 1, 100)

    # Apply default/reset grade for branding
    style.apply_scene_grade(master, 'reset', 1, 100)

    # Optional: Specific dramatic lighting for intro
    bpy.ops.object.light_add(type='POINT', location=(0, -5, 2))
    light = bpy.context.object
    light.name = "IntroLight"
    light.data.energy = 5000 # Increased energy for branding visibility
    light.hide_render = True
    light.keyframe_insert(data_path="hide_render", frame=100)
    light.hide_render = False
    light.keyframe_insert(data_path="hide_render", frame=1)

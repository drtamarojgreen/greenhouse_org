import bpy
import math
import style_utilities as style

def setup_scene(master):
    """
    Intro Branding Scene.
    Shot ID: S00
    Intent: Establish brand identity with high-contrast text.
    """
    # MUSIC CUE: Deep orchestral swell starts. (Point 47)
    # Frame range: 1 - 100
    master.create_intertitle("GreenhouseMD\nPresents", 1, 100)

    # Hide greenhouse during branding (Point 104)
    gh_objs = [obj for obj in bpy.context.scene.objects
               if "Greenhouse" in obj.name or "GH_" in obj.name]
    for obj in gh_objs:
        obj.hide_render = True
        obj.keyframe_insert(data_path="hide_render", frame=1)
        obj.hide_render = False
        obj.keyframe_insert(data_path="hide_render", frame=101)

    # Apply default/reset grade for branding
    style.apply_scene_grade(master, 'reset', 1, 100)

    # Optional: Specific dramatic lighting for intro
    light = bpy.data.objects.get("IntroLight")
    if light:
        # Reposition for branding (Point 142)
        light.location = (0, -5, 2)
        light.keyframe_insert(data_path="location", frame=1)

        # Visibility (Overwrites lighting_setup default)
        style.set_obj_visibility(light, True, 1)
        style.set_obj_visibility(light, False, 101)

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

    # Hide all actors and greenhouse during branding (Point 104, 142)
    hide_keywords = ["Greenhouse", "GH_", "Herbaceous", "Arbor", "GloomGnome", "Brain", "Neuron", "Flower", "Pillar", "Bush"]
    objs_to_hide = [obj for obj in bpy.context.scene.objects
                    if any(k in obj.name for k in hide_keywords)]

    for obj in objs_to_hide:
        # Only hide top-level if possible to avoid redundant keys,
        # but set_obj_visibility handles recursion.
        style.set_obj_visibility(obj, False, 1)
        style.set_obj_visibility(obj, True, 101)

    # Apply default/reset grade for branding
    style.apply_scene_grade(master, 'reset', 1, 100)

    # Optional: Specific dramatic lighting for intro
    light = bpy.data.objects.get("IntroLight")
    if light:
        # Reposition for branding (Point 142: Moved behind camera to avoid glare)
        light.location = (0, -15, 5)
        light.keyframe_insert(data_path="location", frame=1)

        # Visibility (Overwrites lighting_setup default)
        # Point 142: Actually hide it, text is self-emissive
        style.set_obj_visibility(light, False, 1)
        style.set_obj_visibility(light, False, 101)

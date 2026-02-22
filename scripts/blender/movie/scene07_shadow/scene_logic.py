import bpy
import math
import random
import style_utilities as style

def setup_scene(master):
    """
    The Intrusion of Gloom.
    Shot ID: S07
    Intent: Introduce external stress/antagonism through visual mood shifts.
    """
    # MUSIC CUE: Ominous, low strings and dissonant piano.
    # Point 142: Correct frame range (1801 - 2100)
    from constants import SCENE_MAP
    start_f, end_f = SCENE_MAP['scene07_shadow']
    master.create_intertitle("The Intrusion of\nGloom", start_f, start_f + 100)

    # Apply shadow grade
    style.apply_scene_grade(master, 'shadow', start_f, end_f)

    # Mood-Based Fog (Thick in Shadow)
    style.animate_mood_fog(master.scene, 1901, density=0.02)

    # Desaturation Beats (Drop saturation to 20%)
    style.apply_desaturation_beat(master.scene, 2300, 2400, saturation=0.2)

    # Gnome animation and visibility (Point 142: Fix ranges)
    gnome = master.gnome
    if gnome:
        gnome.hide_render = True
        gnome.keyframe_insert(data_path="hide_render", frame=start_f)
        gnome.hide_render = False
        gnome.keyframe_insert(data_path="hide_render", frame=start_f + 101)
        gnome.hide_render = True
        gnome.keyframe_insert(data_path="hide_render", frame=end_f)

        style.apply_fade_transition([gnome], start_f + 101, end_f, mode='IN', duration=16)

        # Entrance movement (Point 142: Use place_character)
        master.place_character(gnome, (5, 5, 0), (0, 0, 0), start_f + 101)
        master.place_character(gnome, (2, 2, 0), (0, 0, 0), end_f)

    # Characters shiver and recoil (Bone-based)
    for char in [master.h1, master.h2]:
        if not char: continue
        torso_bone = char.pose.bones.get("Torso")
        if torso_bone:
            style.insert_looping_noise(torso_bone, "location", index=0, strength=0.05, scale=2.0, frame_start=2101, frame_end=2500)
            # Recoil
            torso_bone.location.y = 0
            torso_bone.keyframe_insert(data_path="location", index=1, frame=2101)
            torso_bone.location.y = -0.5
            torso_bone.keyframe_insert(data_path="location", index=1, frame=2200)

    # Point 142: Use new light rig names
    style.animate_light_flicker("LightShaftBeam", 1901, 2500, strength=0.4)
    style.animate_light_flicker("GnomeKeyLight", 1901, 2500, strength=0.2)

    # Invisible Vignette (Point 150: Preserved but hidden at user request)
    style.animate_vignette(master.scene, 1901, 2500, start_val=0.0, end_val=0.0)

    # Subtle Shivers (Bone-based)
    for char in [master.h1, master.h2]:
        if char:
            torso_bone = char.pose.bones.get("Torso")
            if torso_bone:
                style.insert_looping_noise(torso_bone, "location", strength=0.1, scale=1.0, frame_start=1901, frame_end=2500)

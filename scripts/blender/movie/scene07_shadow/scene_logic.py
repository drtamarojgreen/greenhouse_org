import bpy
import math
import random
import style

def setup_scene(master):
    """
    The Intrusion of Gloom.
    Shot ID: S07
    Intent: Introduce external stress/antagonism through visual mood shifts.
    """
    # MUSIC CUE: Ominous, low strings and dissonant piano.
    master.create_intertitle("The Intrusion of\nGloom", 1801, 1900)

    # Apply shadow grade
    style.apply_scene_grade(master, 'shadow', 1901, 2500)

    # Mood-Based Fog (Thick in Shadow)
    style.animate_mood_fog(master.scene, 1901, density=0.02)

    # Desaturation Beats (Drop saturation to 20%)
    style.apply_desaturation_beat(master.scene, 2300, 2400, saturation=0.2)

    # Gnome animation and visibility
    gnome = master.gnome
    if gnome:
        gnome.hide_render = True
        gnome.keyframe_insert(data_path="hide_render", frame=2100)
        gnome.hide_render = False
        gnome.keyframe_insert(data_path="hide_render", frame=2101)
        gnome.hide_render = True
        gnome.keyframe_insert(data_path="hide_render", frame=2500)

        style.apply_fade_transition([gnome], 2101, 2500, mode='IN', duration=16)

        # Entrance movement
        gnome.location = (5, 5, 0)
        gnome.keyframe_insert(data_path="location", frame=2101)
        gnome.location = (2, 2, 0)
        gnome.keyframe_insert(data_path="location", frame=2300)
        gnome.location = (2, 2, 0)
        gnome.keyframe_insert(data_path="location", frame=2500)

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

    style.animate_light_flicker("Spot", 1901, 2500, strength=0.4)
    style.animate_light_flicker("RimLight", 1901, 2500, strength=0.2)

    # Subtle Shivers (Bone-based)
    for char in [master.h1, master.h2]:
        if char:
            torso_bone = char.pose.bones.get("Torso")
            if torso_bone:
                style.insert_looping_noise(torso_bone, "location", strength=0.1, scale=1.0, frame_start=1901, frame_end=2500)

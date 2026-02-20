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
    start_frame, end_frame = SCENE_MAP['scene07_shadow']
    master.create_intertitle("The Intrusion of\nGloom", start_frame, start_frame + 99)

    # Apply shadow grade
    style.apply_scene_grade(master, 'shadow', start_frame + 100, end_frame)

    # Mood-Based Fog (Thick in Shadow)
    style.animate_mood_fog(master.scene, start_frame + 100, density=0.02)

    # Desaturation Beats (Drop saturation to 20%)
    style.apply_desaturation_beat(master.scene, end_frame - 100, end_frame, saturation=0.2)

    # Gnome animation and visibility
    gnome = master.gnome
    if gnome:
        gnome.hide_render = True
        gnome.keyframe_insert(data_path="hide_render", frame=start_frame + 299)
        gnome.hide_render = False
        gnome.keyframe_insert(data_path="hide_render", frame=start_frame + 300)
        gnome.hide_render = True
        gnome.keyframe_insert(data_path="hide_render", frame=end_frame)

        style.apply_fade_transition([gnome], start_frame + 300, end_frame, mode='IN', duration=16)

        # Entrance movement
        gnome.location = (5, 5, 0)
        gnome.keyframe_insert(data_path="location", frame=start_frame + 300)
        gnome.location = (2, 2, 0)
        gnome.keyframe_insert(data_path="location", frame=end_frame)

    # Characters shiver and recoil (Bone-based)
    for char in [master.h1, master.h2]:
        if not char: continue
        torso_bone = char.pose.bones.get("Torso")
        if torso_bone:
            style.insert_looping_noise(torso_bone, "location", index=0, strength=0.05, scale=2.0, frame_start=start_frame + 300, frame_end=end_frame)
            # Recoil
            torso_bone.location.y = 0
            torso_bone.keyframe_insert(data_path="location", index=1, frame=start_frame + 300)
            torso_bone.location.y = -0.5
            torso_bone.keyframe_insert(data_path="location", index=1, frame=start_frame + 400)

    style.animate_light_flicker("Spot", start_frame + 100, end_frame, strength=0.4)
    style.animate_light_flicker("RimLight", start_frame + 100, end_frame, strength=0.2)

    # Subtle Shivers (Bone-based)
    for char in [master.h1, master.h2]:
        if char:
            torso_bone = char.pose.bones.get("Torso")
            if torso_bone:
                style.insert_looping_noise(torso_bone, "location", strength=0.1, scale=1.0, frame_start=start_frame + 100, frame_end=end_frame)

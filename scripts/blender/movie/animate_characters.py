import bpy
import style
import math
from constants import SCENE_MAP

def animate_characters(master_instance):
    """Coordinates character acting and movement across all scenes."""
    h1 = master_instance.h1
    h2 = master_instance.h2
    gnome = master_instance.gnome

    # --- Persistent acting ---
    for char in [h1, h2, gnome]:
        if not char: continue
        # Enhancement #11: Weight Shift on Torso bone if available
        torso = char.pose.bones.get("Torso") if char.type == 'ARMATURE' else None
        target = torso if torso else char
        style.animate_weight_shift(target, 1, 15000)
        # Enhancement #24: Breathing on Torso bone if available
        style.animate_breathing(target, 1, 15000)

    # --- Scene specific acting ---

    # Interaction Sequence Closeups acting (#39, #87)
    dialogue_scenes = [
        ('scene16_dialogue', 'Herbaceous'),
        ('scene17_dialogue', 'Arbor'),
        ('scene18_dialogue', 'Herbaceous'),
        ('scene19_dialogue', 'Arbor'),
        ('scene20_dialogue', 'GloomGnome'),
        ('scene21_dialogue', 'GloomGnome')
    ]

    for s_name, char_name in dialogue_scenes:
        if s_name in SCENE_MAP:
            start, end = SCENE_MAP[s_name]
            # #39 Micro-movement for listeners
            # If Herbaceous is speaker, Arbor is listener
            listener = 'Arbor' if char_name == 'Herbaceous' else 'Herbaceous'
            style.animate_reaction_shot(listener, start, end)

            # #87 Saccadic eye movement for speaker
            char_obj = bpy.data.objects.get(char_name)
            if char_obj and char_obj.type == 'ARMATURE':
                for bone_name in ["Eye.L", "Eye.R"]:
                    bone = char_obj.pose.bones.get(bone_name)
                    if bone:
                        style.animate_saccadic_movement(bone, None, start, end)
            else:
                head = bpy.data.objects.get(f"{char_name}_Head") or bpy.data.objects.get(f"{char_name}_Torso")
                if head:
                    for child in head.children:
                        if "Eye" in child.name:
                            style.animate_saccadic_movement(child, None, start, end)

    # Enhancement #14: Limping Gait for Gnome
    if gnome:
        style.animate_limp(gnome, 13701, 14500)

    # Enhancement #20: Defensive Crouch
    if gnome:
        if 'scene20_dialogue' in SCENE_MAP:
            start, end = SCENE_MAP['scene20_dialogue']
            style.animate_defensive_crouch(gnome, start, end)

    # Enhancement #19: Thinking Gesture for Herbaceous
    if h1:
        if 'scene16_dialogue' in SCENE_MAP:
            start, end = SCENE_MAP['scene16_dialogue']
            # Find left arm
            if h1.type == 'ARMATURE':
                arm = h1.pose.bones.get("Arm.L")
            else:
                arm = bpy.data.objects.get("Herbaceous_Arm_L")
                
            if arm:
                style.animate_thinking_gesture(arm, start + 50)

    # Enhancement: Walking for movement segments
    from assets import plant_humanoid
    # Moving scenes across the production
    moving_scenes = [
        'scene01_intro', 'scene02_garden', 'scene05_bridge', 
        'scene13_walking', 'scene15_interaction', 'scene22_retreat'
    ]
    for s_name in moving_scenes:
        if s_name in SCENE_MAP:
            start, end = SCENE_MAP[s_name]
            for char in [h1, h2, gnome]:
                if char: plant_humanoid.animate_walk(char, start, end)

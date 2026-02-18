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
        # Enhancement #11: Weight Shift
        style.animate_weight_shift(char, 1, 15000)
        # Enhancement #24: Breathing
        style.animate_breathing(char, 1, 15000)

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
            arm = bpy.data.objects.get("Herbaceous_Arm_L")
            if arm:
                style.animate_thinking_gesture(arm, start + 50)

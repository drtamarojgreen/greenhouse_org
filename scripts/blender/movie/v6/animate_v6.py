import bpy
import random
import math

def animate_character_v6(armature, frame_start, frame_end):
    """
    Advanced Version 6 Character Animation.
    Includes hip sway, rhythmic talk closures, and saccades.
    """
    if not armature or armature.type != 'ARMATURE': return

    # 1. Hip Sway (Procedural Noise)
    torso = armature.pose.bones.get("Torso")
    if torso:
        if not armature.animation_data: armature.animation_data_create()
        action = armature.animation_data.action or bpy.data.actions.new(name=f"V6_Sway_{armature.name}")
        armature.animation_data.action = action

        # Add Noise to Rotation X and Y
        for i in range(2):
            dp = f'pose.bones["{torso.name}"].rotation_euler'
            fcurve = action.fcurves.new(data_path=dp, index=i)
            mod = fcurve.modifiers.new(type='NOISE')
            mod.strength = 0.05
            mod.scale = 20.0

    # 2. Discrete Eye Saccades
    for side in ["L", "R"]:
        eye = armature.pose.bones.get(f"Eye.{side}")
        if eye:
            dp = f'pose.bones["{eye.name}"].rotation_euler'
            for f in range(frame_start, frame_end, random.randint(30, 90)):
                eye.rotation_euler[0] = random.uniform(-0.1, 0.1)
                eye.rotation_euler[2] = random.uniform(-0.1, 0.1)
                armature.keyframe_insert(data_path=dp, frame=f)

def animate_dialogue_v6(armature, frame_start, frame_end):
    """Version 6 dialogue with rhythmic closures."""
    mouth = armature.pose.bones.get("Mouth")
    if not mouth: return

    dp = f'pose.bones["{mouth.name}"].scale'
    for f in range(frame_start, frame_end, 8):
        # Rhythmic open/close
        mouth.scale[2] = 1.5 if (f // 8) % 2 == 0 else 1.0
        armature.keyframe_insert(data_path=dp, index=2, frame=f)

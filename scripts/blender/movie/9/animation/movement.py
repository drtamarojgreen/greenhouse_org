import math
import bpy

def animate_walk(obj, start, duration, get_bone_fn):
    """
    Coordinated walk cycle with independent limb movement.
    """
    if obj.type != 'ARMATURE': return
    cycle_len = 40
    step_h = 0.1

    for f in range(start, start + duration, 5):
        phase = ((f - start) % cycle_len) / cycle_len

        # Torso bob
        torso = get_bone_fn(obj, "Torso")
        if torso:
            torso.location[2] = abs(math.sin(phase * 2 * math.pi)) * step_h
            obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].location', index=2, frame=f)

        # Coordinate Limbs
        _animate_leg_stride(obj, "Leg.L", f, phase, 0.4, get_bone_fn)
        _animate_leg_stride(obj, "Leg.R", f, phase + 0.5, 0.4, get_bone_fn)
        _animate_arm_swing(obj, "Hand.L", f, phase + 0.5, 0.3, get_bone_fn)
        _animate_arm_swing(obj, "Hand.R", f, phase, 0.3, get_bone_fn)

def _animate_arm_swing(obj, bone_name, frame, phase, amplitude, get_bone_fn):
    bone = get_bone_fn(obj, bone_name)
    if bone:
        val = math.sin(phase * 2 * math.pi) * amplitude
        bone.rotation_euler[0] = val
        obj.keyframe_insert(data_path=f'pose.bones["{bone.name}"].rotation_euler', index=0, frame=frame)

def _animate_leg_stride(obj, bone_name, frame, phase, amplitude, get_bone_fn):
    bone = get_bone_fn(obj, bone_name)
    if bone:
        val = math.cos(phase * 2 * math.pi) * amplitude
        bone.rotation_euler[0] = val
        obj.keyframe_insert(data_path=f'pose.bones["{bone.name}"].rotation_euler', index=0, frame=frame)

def animate_sit(obj, start, duration, get_bone_fn):
    """Lowers the rig, tilts the torso back, and rotates thighs/knees for chair sitting."""
    torso = get_bone_fn(obj, "Torso")
    thigh_l = get_bone_fn(obj, "Leg.L")
    thigh_r = get_bone_fn(obj, "Leg.R")
    knee_l = get_bone_fn(obj, "Knee.L")
    knee_r = get_bone_fn(obj, "Knee.R")
    
    if torso:
        # Initial state
        torso.location[2] = 0; torso.rotation_euler[0] = 0
        obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].location', index=2, frame=start)
        obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].rotation_euler', index=0, frame=start)
        # Seated state
        torso.location[2] = -0.6; torso.rotation_euler[0] = math.radians(-10)
        obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].location', index=2, frame=start + duration)
        obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].rotation_euler', index=0, frame=start + duration)

    if thigh_l and thigh_r:
        thigh_l.rotation_euler[0] = 0; thigh_r.rotation_euler[0] = 0
        obj.keyframe_insert(data_path=f'pose.bones["{thigh_l.name}"].rotation_euler', index=0, frame=start)
        obj.keyframe_insert(data_path=f'pose.bones["{thigh_r.name}"].rotation_euler', index=0, frame=start)
        # 90 degree rotation
        thigh_l.rotation_euler[0] = math.radians(90); thigh_r.rotation_euler[0] = math.radians(90)
        obj.keyframe_insert(data_path=f'pose.bones["{thigh_l.name}"].rotation_euler', index=0, frame=start + duration)
        obj.keyframe_insert(data_path=f'pose.bones["{thigh_r.name}"].rotation_euler', index=0, frame=start + duration)

    if knee_l and knee_r:
        knee_l.rotation_euler[0] = 0; knee_r.rotation_euler[0] = 0
        obj.keyframe_insert(data_path=f'pose.bones["{knee_l.name}"].rotation_euler', index=0, frame=start)
        obj.keyframe_insert(data_path=f'pose.bones["{knee_r.name}"].rotation_euler', index=0, frame=start)
        # -90 degree rotation
        knee_l.rotation_euler[0] = math.radians(-90); knee_r.rotation_euler[0] = math.radians(-90)
        obj.keyframe_insert(data_path=f'pose.bones["{knee_l.name}"].rotation_euler', index=0, frame=start + duration)
        obj.keyframe_insert(data_path=f'pose.bones["{knee_r.name}"].rotation_euler', index=0, frame=start + duration)

def animate_stand(obj, start, duration, get_bone_fn):
    """Raises the rig and straightens the torso."""
    torso = get_bone_fn(obj, "Torso")
    if torso:
        # Initial seated state
        torso.location[2] = -0.5; torso.rotation_euler[0] = math.radians(-10)
        obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].location', index=2, frame=start)
        obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].rotation_euler', index=0, frame=start)
        # Standing state
        torso.location[2] = 0; torso.rotation_euler[0] = 0
        obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].location', index=2, frame=start + duration)
        obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].rotation_euler', index=0, frame=start + duration)

def animate_climb(obj, start, duration, get_bone_fn):
    """Simulates a vertical climb with swaying."""
    torso = get_bone_fn(obj, "Torso")
    if torso:
        for f in range(start, start + duration, 10):
            phase = (f - start) / duration
            torso.location[2] = phase * 5.0 # Ascent
            torso.location[0] = math.sin(f * 0.2) * 0.1 # Sway
            obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].location', index=0, frame=f)
            obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].location', index=2, frame=f)

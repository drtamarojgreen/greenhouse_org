import bpy
import math
import random
import mathutils

# ---------------------------------------------------------------------------
# BONE MAPPING & RESOLUTION
# ---------------------------------------------------------------------------

BONE_NAME_MAP = {
    "Head": "mixamorig:Head",
    "Neck": "mixamorig:Neck",
    "Torso": "mixamorig:Spine2",
    "Tail": "mixamorig:Hips",
    "Hand.L": "mixamorig:LeftHand",
    "Hand.R": "mixamorig:RightHand",
    "Foot.L": "mixamorig:LeftFoot",
    "Foot.R": "mixamorig:RightFoot",
    "Arm.L": "mixamorig:LeftArm",
    "Arm.R": "mixamorig:RightArm",
    "Elbow.L": "mixamorig:LeftForeArm",
    "Elbow.R": "mixamorig:RightForeArm",
    "Thigh.L": "mixamorig:LeftUpLeg",
    "Thigh.R": "mixamorig:RightUpLeg",
    "Knee.L": "mixamorig:LeftLeg",
    "Knee.R": "mixamorig:RightLeg"
}

def get_bone(arm_obj, name):
    """Safely retrieves a bone by standard name, mapped Mixamo name, or prefix fallback."""
    if not arm_obj or arm_obj.type != 'ARMATURE': return None
    bone = arm_obj.pose.bones.get(name)
    if bone: return bone
    mapped_name = BONE_NAME_MAP.get(name)
    if mapped_name:
        bone = arm_obj.pose.bones.get(mapped_name)
        if bone: return bone
    return arm_obj.pose.bones.get(f"mixamorig:{name}")

# ---------------------------------------------------------------------------
# MODULAR ANIMATION REGISTRY
# ---------------------------------------------------------------------------

def apply_animation_by_tag(arm_obj, tag, start_frame, duration=None, prop_obj=None):
    """Dispatcher to apply varied animations based on modular tags."""
    if ":" in tag:
        tag, _ = tag.split(":", 1)
    
    registry = {
        "nod": (apply_nod, 24),
        "shake": (apply_shake_head, 45),
        "blink": (apply_blink, 6),
        "talking": (apply_talking_arms, duration or 60),
        "dance": (apply_dance, duration or 600),
        "float": (apply_float, duration or 120),
        "sway": (apply_sway, duration or 80),
        "shiver": (apply_shiver, 48),
        "droop": (apply_droop, 60),
        "stretch": (apply_stretch, 40),
        "joyful": (apply_joyful, 40),
        "bend": (apply_bend, 60),
    }
    
    if tag in registry:
        func, def_dur = registry[tag]
        dur = duration if duration is not None else def_dur
        func(arm_obj, start_frame, duration=dur)
        return True
    return False

# ---------------------------------------------------------------------------
# ANIMATION FUNCTIONS
# ---------------------------------------------------------------------------

def apply_nod(arm_obj, start_frame, duration=24):
    head = get_bone(arm_obj, "Head")
    neck = get_bone(arm_obj, "Neck")
    if not head or not neck: return
    mid_frame = start_frame + (duration // 2)
    end_frame = start_frame + duration
    for b in (head, neck):
        b.rotation_mode = 'XYZ'
        b.keyframe_insert(data_path="rotation_euler", index=0, frame=start_frame)
        b.rotation_euler[0] += math.radians(-12)
        b.keyframe_insert(data_path="rotation_euler", index=0, frame=mid_frame)
        b.rotation_euler[0] -= math.radians(-12)
        b.keyframe_insert(data_path="rotation_euler", index=0, frame=end_frame)

def apply_shake_head(arm_obj, start_frame, duration=45):
    head = get_bone(arm_obj, "Head")
    if not head: return
    head.rotation_mode = 'XYZ'
    end_frame = start_frame + duration
    head.keyframe_insert(data_path="rotation_euler", index=2, frame=start_frame)
    for i, offset in enumerate([18, -18, 0]):
        f = start_frame + (i + 1) * (duration // 3)
        head.rotation_euler[2] = math.radians(offset)
        head.keyframe_insert(data_path="rotation_euler", index=2, frame=f)

def apply_blink(arm_obj, start_frame, duration=6):
    for child in arm_obj.children:
        if "Eyelid" in child.name:
            child.keyframe_insert(data_path="scale", index=2, frame=start_frame)
            child.scale[2] = 0.02
            child.keyframe_insert(data_path="scale", index=2, frame=start_frame + (duration//2))
            child.scale[2] = 1.0
            child.keyframe_insert(data_path="scale", index=2, frame=start_frame + duration)

def apply_talking_arms(arm_obj, start_frame, duration=60):
    arm_l = get_bone(arm_obj, "Arm.L")
    arm_r = get_bone(arm_obj, "Arm.R")
    if not arm_l or not arm_r: return
    end_frame = start_frame + duration
    for b in (arm_l, arm_r):
        b.rotation_mode = 'XYZ'
        b.keyframe_insert(data_path="rotation_euler", frame=start_frame)
    for f in range(start_frame + 5, end_frame - 5, 12):
        arm_l.rotation_euler[0] = math.radians(-80 + random.uniform(-10, 10))
        arm_r.rotation_euler[0] = math.radians(-80 + random.uniform(-10, 10))
        arm_l.keyframe_insert(data_path="rotation_euler", frame=f)
        arm_r.keyframe_insert(data_path="rotation_euler", frame=f)

def apply_dance(arm_obj, start_frame, duration=600):
    torso = get_bone(arm_obj, "Torso")
    if not torso: return
    torso.rotation_mode = 'XYZ'
    # Start keyframe
    arm_obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].location', index=2, frame=start_frame)
    arm_obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].rotation_euler', index=2, frame=start_frame)
    for f in range(start_frame + 10, start_frame + duration, 20):
        phase = (f - start_frame) * 0.2
        torso.location[2] = math.sin(phase) * 0.15
        torso.rotation_euler[2] = math.cos(phase) * math.radians(8)
        arm_obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].location', index=2, frame=f)
        arm_obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].rotation_euler', index=2, frame=f)

def apply_float(arm_obj, start_frame, duration=120):
    torso = get_bone(arm_obj, "Torso")
    if not torso: return
    arm_obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].location', index=2, frame=start_frame)
    for f in range(start_frame + 10, start_frame + duration + 1, 15):
        phase = (f - start_frame) / duration * 2 * math.pi
        torso.location[2] = math.sin(phase) * 0.25
        arm_obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].location', index=2, frame=f)

def apply_sway(arm_obj, start_frame, duration=80):
    torso = get_bone(arm_obj, "Torso")
    if not torso: return
    torso.rotation_mode = 'XYZ'
    arm_obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].rotation_euler', index=2, frame=start_frame)
    for f in range(start_frame + 8, start_frame + duration + 1, 10):
        phase = (f - start_frame) / duration * 2 * math.pi
        torso.rotation_euler[2] = math.sin(phase) * math.radians(6)
        arm_obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].rotation_euler', index=2, frame=f)

def apply_shiver(arm_obj, start_frame, duration=48):
    torso = get_bone(arm_obj, "Torso")
    if not torso: return
    arm_obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].location', frame=start_frame)
    for f in range(start_frame + 1, start_frame + duration):
        torso.location[0] = random.uniform(-0.015, 0.015)
        torso.location[1] = random.uniform(-0.015, 0.015)
        arm_obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].location', frame=f)

def apply_droop(arm_obj, start_frame, duration=60):
    head = get_bone(arm_obj, "Head")
    neck = get_bone(arm_obj, "Neck")
    if not head or not neck: return
    for b in (head, neck):
        b.rotation_mode = 'XYZ'
        b.keyframe_insert(data_path="rotation_euler", index=0, frame=start_frame)
        b.rotation_euler[0] = math.radians(-30)
        b.keyframe_insert(data_path="rotation_euler", index=0, frame=start_frame + duration // 2)
        b.keyframe_insert(data_path="rotation_euler", index=0, frame=start_frame + duration)

def apply_stretch(arm_obj, start_frame, duration=40):
    torso = get_bone(arm_obj, "Torso")
    if not torso: return
    torso.rotation_mode = 'XYZ'
    torso.keyframe_insert(data_path="rotation_euler", index=0, frame=start_frame)
    torso.rotation_euler[0] = math.radians(15)
    torso.keyframe_insert(data_path="rotation_euler", index=0, frame=start_frame + duration // 2)
    torso.rotation_euler[0] = 0
    torso.keyframe_insert(data_path="rotation_euler", index=0, frame=start_frame + duration)

def apply_joyful(arm_obj, start_frame, duration=40):
    torso = get_bone(arm_obj, "Torso")
    if not torso: return
    arm_obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].location', index=2, frame=start_frame)
    torso.location[2] += 0.2
    arm_obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].location', index=2, frame=start_frame + 10)
    torso.location[2] -= 0.2
    arm_obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].location', index=2, frame=start_frame + duration)

def apply_bend(arm_obj, start_frame, duration=60):
    torso = get_bone(arm_obj, "Torso")
    if not torso: return
    torso.rotation_mode = 'XYZ'
    torso.keyframe_insert(data_path="rotation_euler", index=0, frame=start_frame)
    torso.rotation_euler[0] = math.radians(-45)
    arm_obj.keyframe_insert(data_path="rotation_euler", index=0, frame=start_frame + duration // 2)
    torso.rotation_euler[0] = 0
    arm_obj.keyframe_insert(data_path="rotation_euler", index=0, frame=start_frame + duration)

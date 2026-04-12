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
    """Dispatcher to apply animations based on varied performing styles."""
    if ":" in tag: tag, _ = tag.split(":", 1)
    
    registry = {
        "spirit_dance": (apply_dance, duration or 600),
        "ancient_talking": (apply_talking_arms, duration or 120),
        "bloom_sway": (apply_sway, duration or 100),
        "ethereal_drift": (apply_drift, duration or 300),
        "golden_ascent": (apply_ascent, duration or 400),
        "solar_flare": (apply_flare, duration or 45),
        "earth_hum": (apply_hum, duration or 200),
        "majestic_glide": (apply_glide, duration or 1000),
        "sprite_flutter": (apply_flutter, duration or 60),
        "stoic_pulse": (apply_pulse, duration or 120),
        "blink": (apply_blink, 6),
        "nod": (apply_nod, 24)
    }
    
    if tag in registry:
        func, def_dur = registry[tag]
        func(arm_obj, start_frame, duration=duration if duration else def_dur)
        return True
    return False

# ---------------------------------------------------------------------------
# PERFORMANCE FUNCTIONS
# ---------------------------------------------------------------------------

def _ensure_init(arm_obj, bone_names, frame):
    """Keyframes the initial state of bones."""
    for bn in bone_names:
        b = get_bone(arm_obj, bn)
        if b:
            arm_obj.keyframe_insert(data_path=f'pose.bones["{b.name}"].location', frame=frame)
            arm_obj.keyframe_insert(data_path=f'pose.bones["{b.name}"].rotation_euler', frame=frame)

def apply_dance(arm_obj, start_frame, duration=600):
    torso = get_bone(arm_obj, "Torso")
    if not torso: return
    _ensure_init(arm_obj, ["Torso"], start_frame)
    for f in range(start_frame + 20, start_frame + duration, 40):
        phase = (f - start_frame) * 0.15
        torso.location[2] = math.sin(phase) * 0.2
        arm_obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].location', index=2, frame=f)

def apply_sway(arm_obj, start_frame, duration=120):
    torso = get_bone(arm_obj, "Torso")
    if not torso: return
    _ensure_init(arm_obj, ["Torso"], start_frame)
    for f in range(start_frame + 10, start_frame + duration, 20):
        torso.rotation_mode = 'XYZ'
        torso.rotation_euler[0] = math.radians(math.sin(f*0.05)*8)
        arm_obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].rotation_euler', index=0, frame=f)

def apply_drift(arm_obj, start_frame, duration=300):
    arm_obj.keyframe_insert(data_path="location", frame=start_frame)
    for f in range(start_frame + 50, start_frame + duration, 50):
        arm_obj.location.x += random.uniform(-0.2, 0.2)
        arm_obj.keyframe_insert(data_path="location", index=0, frame=f)

def apply_ascent(arm_obj, start_frame, duration=400):
    arm_obj.keyframe_insert(data_path="location", index=2, frame=start_frame)
    arm_obj.location.z += 3.0
    arm_obj.keyframe_insert(data_path="location", index=2, frame=start_frame + duration)

def apply_flare(arm_obj, start_frame, duration=45):
    _ensure_init(arm_obj, ["Torso"], start_frame)
    for f in range(start_frame + 5, start_frame + duration, 5):
        arm_obj.rotation_euler[2] = math.radians(random.uniform(-10, 10))
        arm_obj.keyframe_insert(data_path="rotation_euler", index=2, frame=f)

def apply_hum(arm_obj, start_frame, duration=200):
    arm_obj.keyframe_insert(data_path="location", frame=start_frame)
    for f in range(start_frame + 2, start_frame + duration, 4):
        arm_obj.location.y += random.uniform(-0.02, 0.02)
        arm_obj.keyframe_insert(data_path="location", index=1, frame=f)

def apply_glide(arm_obj, start_frame, duration=1000):
    arm_obj.keyframe_insert(data_path="location", frame=start_frame)
    arm_obj.location.x += 6.0
    arm_obj.keyframe_insert(data_path="location", index=0, frame=start_frame + duration)

def apply_flutter(arm_obj, start_frame, duration=60):
    arm_l = get_bone(arm_obj, "Arm.L")
    arm_r = get_bone(arm_obj, "Arm.R")
    if not (arm_l and arm_r): return
    _ensure_init(arm_obj, ["Arm.L", "Arm.R"], start_frame)
    for f in range(start_frame + 5, start_frame + duration, 10):
        arm_l.rotation_mode = 'XYZ'
        arm_r.rotation_mode = 'XYZ'
        arm_l.rotation_euler[0] = math.radians(-60 + random.uniform(-15, 15))
        arm_r.rotation_euler[0] = math.radians(-60 + random.uniform(-15, 15))
        arm_l.keyframe_insert(data_path=f'pose.bones["{arm_l.name}"].rotation_euler', index=0, frame=f)
        arm_r.keyframe_insert(data_path=f'pose.bones["{arm_r.name}"].rotation_euler', index=0, frame=f)

def apply_pulse(arm_obj, start_frame, duration=120):
    _ensure_init(arm_obj, ["Torso"], start_frame)
    torso = get_bone(arm_obj, "Torso")
    for f in range(start_frame + 15, start_frame + duration, 30):
        torso.scale[2] = 1.05
        arm_obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].scale', index=2, frame=f)
        torso.scale[2] = 1.0
        arm_obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].scale', index=2, frame=f+15)

def apply_blink(arm_obj, start_frame, duration=6):
    for child in arm_obj.children:
        if "Eyelid" in child.name:
            child.keyframe_insert(data_path="scale", index=2, frame=start_frame)
            child.scale[2] = 0.05
            child.keyframe_insert(data_path="scale", index=2, frame=start_frame + (duration//2))
            child.scale[2] = 1.0
            child.keyframe_insert(data_path="scale", index=2, frame=start_frame + duration)

def apply_nod(arm_obj, start_frame, duration=24):
    head = get_bone(arm_obj, "Head")
    if not head: return
    _ensure_init(arm_obj, ["Head"], start_frame)
    head.rotation_mode = 'XYZ'
    head.rotation_euler[0] += math.radians(15)
    arm_obj.keyframe_insert(data_path=f'pose.bones["{head.name}"].rotation_euler', index=0, frame=start_frame + (duration//2))
    head.rotation_euler[0] -= math.radians(15)
    arm_obj.keyframe_insert(data_path=f'pose.bones["{head.name}"].rotation_euler', index=0, frame=start_frame + duration)

def apply_talking_arms(arm_obj, start_frame, duration=60):
    arm_l = get_bone(arm_obj, "Arm.L")
    arm_r = get_bone(arm_obj, "Arm.R")
    if not (arm_l and arm_r): return
    _ensure_init(arm_obj, ["Arm.L", "Arm.R"], start_frame)
    for f in range(start_frame + 5, start_frame + duration, 15):
        arm_l.rotation_mode = 'XYZ'
        arm_r.rotation_mode = 'XYZ'
        arm_l.rotation_euler[0] = math.radians(-45 + random.uniform(-10, 10))
        arm_r.rotation_euler[0] = math.radians(-45 + random.uniform(-10, 10))
        arm_l.keyframe_insert(data_path=f'pose.bones["{arm_l.name}"].rotation_euler', index=0, frame=f)
        arm_r.keyframe_insert(data_path=f'pose.bones["{arm_r.name}"].rotation_euler', index=0, frame=f)

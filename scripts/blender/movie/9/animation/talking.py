import math
import bpy

def animate_talking(obj, start, duration, get_bone_fn):
    """
    Procedural talking animation.
    Uses sine-based head tilt to represent verbal communication.
    """
    if obj.type != 'ARMATURE': return
    bone = get_bone_fn(obj, "Head") or get_bone_fn(obj, "Lip.Lower")
    if not bone: return

    for f in range(start, start + duration):
        # Professional-grade chatter frequency
        val = math.sin(f * 0.5) * 0.05
        bone.rotation_euler[0] = val
        bone.keyframe_insert(data_path="rotation_euler", index=0, frame=f)

def animate_smile(obj, start, duration, get_bone_fn):
    """Subtle upward tilt for positivity."""
    lip_l = get_bone_fn(obj, "Lip.Corner.Ctrl.L")
    lip_r = get_bone_fn(obj, "Lip.Corner.Ctrl.R")
    if lip_l and lip_r:
        lip_l.location[2] += 0.02
        lip_l.location[0] -= 0.01
        lip_r.location[2] += 0.02
        lip_r.location[0] += 0.01
        obj.keyframe_insert(data_path=f'pose.bones["{lip_l.name}"].location', frame=start + duration)
        obj.keyframe_insert(data_path=f'pose.bones["{lip_r.name}"].location', frame=start + duration)
    else:
        head = get_bone_fn(obj, "Head")
        if head:
            head.rotation_euler[0] -= math.radians(5)
            obj.keyframe_insert(data_path=f'pose.bones["{head.name}"].rotation_euler', index=0, frame=start + duration)

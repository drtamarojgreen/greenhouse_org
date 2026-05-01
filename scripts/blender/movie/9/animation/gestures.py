import math
import random
import bpy

def animate_idle(obj, start, duration, get_bone_fn):
    if obj.type != 'ARMATURE': return
    bone = get_bone_fn(obj, "Torso")
    if not bone: return
    for f in range(start, start + duration, 10):
        val = math.sin(f * 0.1) * 0.02
        bone.location[2] = val
        bone.keyframe_insert(data_path="location", index=2, frame=f)

def animate_nod(obj, start, get_bone_fn):
    if obj.type != 'ARMATURE': return
    bone = get_bone_fn(obj, "Head")
    if not bone: return
    bone.rotation_euler[0] = 0; bone.keyframe_insert(data_path="rotation_euler", index=0, frame=start)
    bone.rotation_euler[0] = math.radians(15); bone.keyframe_insert(data_path="rotation_euler", index=0, frame=start + 10)
    bone.rotation_euler[0] = 0; bone.keyframe_insert(data_path="rotation_euler", index=0, frame=start + 20)

def animate_shake(obj, start, get_bone_fn):
    if obj.type != 'ARMATURE': return
    bone = get_bone_fn(obj, "Head")
    if not bone: return
    bone.rotation_euler[2] = 0; bone.keyframe_insert(data_path="rotation_euler", index=2, frame=start)
    bone.rotation_euler[2] = math.radians(10); bone.keyframe_insert(data_path="rotation_euler", index=2, frame=start + 5)
    bone.rotation_euler[2] = math.radians(-10); bone.keyframe_insert(data_path="rotation_euler", index=2, frame=start + 15)
    bone.rotation_euler[2] = 0; bone.keyframe_insert(data_path="rotation_euler", index=2, frame=start + 20)

def animate_dance(obj, start, duration, get_bone_fn):
    if obj.type != 'ARMATURE': return
    torso = get_bone_fn(obj, "Torso")
    hip = get_bone_fn(obj, "Tail")
    if not torso: return
    for f in range(start, start + duration, 4):
        phase = (f - start) * 0.1
        torso.location[2] = math.sin(phase) * 0.1
        torso.keyframe_insert(data_path="location", index=2, frame=f)
        if hip:
            hip.location[1] = math.cos(phase) * 0.05
            hip.keyframe_insert(data_path="location", index=1, frame=f)

def animate_blink(obj, start, duration):
    for child in obj.children:
        if "Eye" in child.name:
            child.scale[2] = 1.0; child.keyframe_insert(data_path="scale", index=2, frame=start)
            child.scale[2] = 0.1; child.keyframe_insert(data_path="scale", index=2, frame=start + (duration//2))
            child.scale[2] = 1.0; child.keyframe_insert(data_path="scale", index=2, frame=start + duration)

def animate_shiver(obj, start, duration, get_bone_fn):
    torso = get_bone_fn(obj, "Torso")
    if not torso: return
    for f in range(start, start + duration, 2):
        torso.location[0] = (random.random() - 0.5) * 0.02
        torso.location[1] = (random.random() - 0.5) * 0.02
        obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].location', index=0, frame=f)
        obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].location', index=1, frame=f)

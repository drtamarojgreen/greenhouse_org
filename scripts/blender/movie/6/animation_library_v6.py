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
    "Foot.R": "mixamorig:RightFoot"
}

def get_bone(arm_obj, name):
    """Safely retrieves a bone by standard name, mapped Mixamo name, or prefix fallback."""
    if not arm_obj or arm_obj.type != 'ARMATURE': return None
    
    # 1. Try standard name (Internal/V5)
    bone = arm_obj.pose.bones.get(name)
    if bone: return bone
    
    # 2. Try mapped name (V6/Mixamo)
    mapped_name = BONE_NAME_MAP.get(name)
    if mapped_name:
        bone = arm_obj.pose.bones.get(mapped_name)
        if bone: return bone
    
    # 3. Try automatic prefixing
    return arm_obj.pose.bones.get(f"mixamorig:{name}")

# ---------------------------------------------------------------------------
# MODULAR ANIMATION REGISTRY
# ---------------------------------------------------------------------------

def apply_animation_by_tag(arm_obj, tag, start_frame, duration=None, prop_obj=None):
    """Dispatcher to apply animations based on modular tags."""
    full_tag = tag
    arg = None
    if ":" in tag:
        tag, arg = tag.split(":", 1)
    
    registry = {
        "nod": (apply_nod, 24),
        "shake": (apply_shake_head, 45),
        "blink": (apply_blink, 6),
        "talking": (apply_talking_arms, duration or 60),
        "dance": (apply_dance, duration or 600),
        "idle": (apply_idle_sway, duration or 120),
        "dodge": (apply_dodge, duration or 30),
        "glow_reaction": (apply_glow_reaction, duration or 60),
    }
    
    if tag in registry:
        func, def_dur = registry[tag]
        dur = duration if duration is not None else def_dur
        func(arm_obj, start_frame, duration=dur)
        return True
    return False

# ---------------------------------------------------------------------------
# ANIMATION FUNCTIONS (REFACTORED FOR GET_BONE)
# ---------------------------------------------------------------------------

def apply_nod(arm_obj, start_frame, duration=24):
    head = get_bone(arm_obj, "Head")
    neck = get_bone(arm_obj, "Neck")
    if not head or not neck: return

    mid_frame = start_frame + (duration // 2)
    end_frame = start_frame + duration
    
    dp_h = f'pose.bones["{head.name}"].rotation_euler'
    dp_n = f'pose.bones["{neck.name}"].rotation_euler'

    # Keyframe initial
    arm_obj.keyframe_insert(data_path=dp_h, frame=start_frame)
    arm_obj.keyframe_insert(data_path=dp_n, frame=start_frame)

    # Nod down
    head.rotation_euler[0] += math.radians(15)
    neck.rotation_euler[0] += math.radians(5)
    arm_obj.keyframe_insert(data_path=dp_h, frame=mid_frame)
    arm_obj.keyframe_insert(data_path=dp_n, frame=mid_frame)

    # Return
    head.rotation_euler[0] -= math.radians(15)
    neck.rotation_euler[0] -= math.radians(5)
    arm_obj.keyframe_insert(data_path=dp_h, frame=end_frame)
    arm_obj.keyframe_insert(data_path=dp_n, frame=end_frame)

def apply_shake_head(arm_obj, start_frame, duration=45):
    head = get_bone(arm_obj, "Head")
    if not head: return
    
    dp = f'pose.bones["{head.name}"].rotation_euler'
    arm_obj.keyframe_insert(data_path=dp, index=2, frame=start_frame)
    
    cycle = duration // 3
    for i, offset in enumerate([15, -15, 0]):
        f = start_frame + (i + 1) * cycle
        head.rotation_euler[2] = math.radians(offset)
        arm_obj.keyframe_insert(data_path=dp, index=2, frame=f)

def apply_blink(arm_obj, start_frame, duration=6):
    # Spirits might not have eye meshes setup the same way as plants.
    # We look for Eye objects parented to the armature.
    for child in arm_obj.children:
        if "Eye" in child.name:
            child.scale[2] = 1.0
            child.keyframe_insert(data_path="scale", index=2, frame=start_frame)
            child.scale[2] = 0.1
            child.keyframe_insert(data_path="scale", index=2, frame=start_frame + (duration//2))
            child.scale[2] = 1.0
            child.keyframe_insert(data_path="scale", index=2, frame=start_frame + duration)

def apply_talking_arms(arm_obj, start_frame, duration=60):
    """Uses bone rotations (Euler) for talking to ensure visibility and constraint compliance."""
    # Ensure all bones are XYZ mode for Euler animation (Point 142)
    for pb in arm_obj.pose.bones:
        pb.rotation_mode = 'XYZ'

    hand_l = get_bone(arm_obj, "Hand.L")
    hand_r = get_bone(arm_obj, "Hand.R")
    arm_l = get_bone(arm_obj, "Arm.L")
    arm_r = get_bone(arm_obj, "Arm.R")

    if not hand_l or not hand_r: return

    if not arm_obj.animation_data:
        arm_obj.animation_data_create()

    # In Blender 4.0+, ensure we have an action
    if not arm_obj.animation_data.action:
        arm_obj.animation_data.action = bpy.data.actions.new(name=f"Action_{arm_obj.name}")

    # Helper to insert rotation keyframes
    def key_rot(bone, axis, val, frame):
        bone.rotation_euler[axis] = val
        arm_obj.keyframe_insert(data_path=f'pose.bones["{bone.name}"].rotation_euler', index=axis, frame=frame)

    # Use deterministic sine waves for rotations ( Euler XYZ )
    for f in range(start_frame, start_frame + duration + 1, 10):
        phase = (f - start_frame) * 0.15
        # Rhythmic arm sway
        if arm_l: key_rot(arm_l, 0, math.radians(-30 + math.sin(phase) * 10), f)
        if arm_r: key_rot(arm_r, 0, math.radians(-30 + math.cos(phase) * 10), f)
        # Wrist/Hand flicker
        key_rot(hand_l, 2, math.sin(phase * 1.5) * 0.2, f)
        key_rot(hand_r, 2, math.cos(phase * 1.5) * 0.2, f)

def apply_dance(arm_obj, start_frame, duration=600):
    """Rhythmic bobbing using get_bone."""
    torso = get_bone(arm_obj, "Torso")
    hip = get_bone(arm_obj, "Tail") or get_bone(arm_obj, "Hips")
    if not torso: return
    
    dp_t = f'pose.bones["{torso.name}"].location'
    
    # Rhythmic bobbing (Deterministic)
    for f in range(start_frame, start_frame + duration + 1, 4):
        phase = (f - start_frame) * 0.1
        torso.location[2] = math.sin(phase) * 0.15
        arm_obj.keyframe_insert(data_path=dp_t, index=2, frame=f)
        
        if hip:
            dp_h = f'pose.bones["{hip.name}"].location'
            hip.location[1] = math.cos(phase) * 0.08
            arm_obj.keyframe_insert(data_path=dp_h, index=1, frame=f)

def apply_idle_sway(arm_obj, start_frame, duration=120):
    """Gentle breathing/sway motion."""
    torso = get_bone(arm_obj, "Torso")
    if not torso: return

    dp = f'pose.bones["{torso.name}"].rotation_euler'

    for f in range(start_frame, start_frame + duration, 10):
        phase = (f - start_frame) * 0.05
        torso.rotation_euler[0] += math.sin(phase) * 0.02
        torso.rotation_euler[1] += math.cos(phase) * 0.01
        arm_obj.keyframe_insert(data_path=dp, frame=f)

def apply_dodge(arm_obj, start_frame, duration=30):
    """Quick lateral dodge representing cognitive flexibility."""
    torso = get_bone(arm_obj, "Torso")
    if not torso: return

    dp = f'pose.bones["{torso.name}"].location'
    mid = start_frame + (duration // 2)
    end = start_frame + duration

    # Start
    arm_obj.keyframe_insert(data_path=dp, index=0, frame=start_frame)
    # Dodge Left
    torso.location[0] += 0.3
    arm_obj.keyframe_insert(data_path=dp, index=0, frame=mid)
    # Return
    torso.location[0] -= 0.3
    arm_obj.keyframe_insert(data_path=dp, index=0, frame=end)

def apply_glow_reaction(arm_obj, start_frame, duration=60):
    """Simulates a glow reaction by scaling eye/facial props or via emission if available."""
    # Find eye objects parented to armature (recursive to handle nested props)
    for child in arm_obj.children_recursive:
        if "Eye" in child.name or "Lid" in child.name:
            # Rhythmic pulse
            for i in range(3):
                f = start_frame + i * (duration // 3)
                child.scale = (1.2, 1.2, 1.2)
                child.keyframe_insert(data_path="scale", frame=f)
                child.scale = (1.0, 1.0, 1.0)
                child.keyframe_insert(data_path="scale", frame=f + (duration // 6))

# ---------------------------------------------------------------------------
# PROP ATTACHMENT
# ---------------------------------------------------------------------------

def attach_prop(armature_obj, prop_obj, bone_name="Hand.L", frame=1):
    """Attaches a prop to a bone using Child-Of constraint (Mixamo aware)."""
    target_bone = get_bone(armature_obj, bone_name)
    if not target_bone:
        print(f"Warning: Bone {bone_name} not found for prop attachment.")
        return
        
    bpy.context.scene.frame_set(frame)
    
    con_name = "SpiritGrasp"
    con = prop_obj.constraints.get(con_name) or prop_obj.constraints.new(type='CHILD_OF')
    con.name = con_name
    con.target = armature_obj
    con.subtarget = target_bone.name
    
    # Visual inverse to keep current position
    old_matrix = prop_obj.matrix_world.copy()
    con.inverse_matrix = armature_obj.matrix_world.inverted() @ armature_obj.pose.bones[target_bone.name].matrix.inverted()
    prop_obj.matrix_world = old_matrix
    
    # Keyframe the influence
    con.influence = 1.0
    prop_obj.keyframe_insert(data_path=f'constraints["{con_name}"].influence', frame=frame)

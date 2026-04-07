import bpy
import math

def apply_nod(arm_obj, start_frame, duration=24):
    """Applies a gentle approving nod over the given duration."""
    head = arm_obj.pose.bones.get("Head")
    neck = arm_obj.pose.bones.get("Neck")
    if not head or not neck: return

    mid_frame = start_frame + (duration // 2)
    end_frame = start_frame + duration

    for bone in (head, neck):
        bone.rotation_mode = 'XYZ'
        # Start
        bone.keyframe_insert(data_path="rotation_euler", index=0, frame=start_frame)
        
        # Nod down (-X rotation in local bone space, but it might be +X depending on roll.
        # Plant humanoid faces -Y. So rotating X pitches the head up/down.
        orig_x = bone.rotation_euler[0]
        bone.rotation_euler[0] = orig_x + math.radians(-10) # Nod down
        bone.keyframe_insert(data_path="rotation_euler", index=0, frame=mid_frame)
        
        # Return
        bone.rotation_euler[0] = orig_x
        bone.keyframe_insert(data_path="rotation_euler", index=0, frame=end_frame)

def apply_shake_head(arm_obj, start_frame, duration=30):
    """Applies a side-to-side head shake (disapproval) over duration."""
    head = arm_obj.pose.bones.get("Head")
    if not head: return

    q1 = start_frame + (duration // 4)
    q3 = start_frame + (duration * 3 // 4)
    end_frame = start_frame + duration

    head.rotation_mode = 'XYZ'
    orig_z = head.rotation_euler[2]
    
    # Start
    head.keyframe_insert(data_path="rotation_euler", index=2, frame=start_frame)
    # Left
    head.rotation_euler[2] = orig_z + math.radians(15)
    head.keyframe_insert(data_path="rotation_euler", index=2, frame=q1)
    # Right
    head.rotation_euler[2] = orig_z - math.radians(15)
    head.keyframe_insert(data_path="rotation_euler", index=2, frame=q3)
    # End
    head.rotation_euler[2] = orig_z
    head.keyframe_insert(data_path="rotation_euler", index=2, frame=end_frame)

def apply_smile(arm_obj, start_frame, duration=30):
    """Pulls lip corners outward and upward, creating a smile."""
    corners = {
        "L": arm_obj.pose.bones.get("Lip.Corner.Ctrl.L"),
        "R": arm_obj.pose.bones.get("Lip.Corner.Ctrl.R")
    }
    if not all(corners.values()): return
    
    end_frame = start_frame + duration

    for side, bone in corners.items():
        base_loc = bone.location.copy()
        bone.keyframe_insert(data_path="location", frame=start_frame)
        
        # Pull outward (+/- X) and upward (+Z) - relative to local space
        x_dir = 0.02 if side == "L" else -0.02
        z_dir = 0.015
        
        bone.location[0] += x_dir
        bone.location[2] += z_dir
        
        # Smooth arrival
        bone.keyframe_insert(data_path="location", frame=end_frame)

def apply_blink(arm_obj, start_frame, duration=6):
    """Procedurally closes and opens eyelids within duration."""
    for side in ("L", "R"):
        lid_u = arm_obj.pose.bones.get(f"Eyelid.Upper.{side}")
        lid_l = arm_obj.pose.bones.get(f"Eyelid.Lower.{side}")
        if not (lid_u and lid_l): continue
        
        midpoint = start_frame + (duration // 2)
        end_frame = start_frame + duration
        
        for bone in (lid_u, lid_l):
            bone.keyframe_insert(data_path="location", frame=start_frame)

        # Close
        lid_u.location[2] = -0.04
        lid_u.location[1] = 0.015
        lid_l.location[2] = 0.04
        lid_l.location[1] = 0.015
        
        for bone in (lid_u, lid_l):
            bone.keyframe_insert(data_path="location", frame=midpoint)

        # Open
        lid_u.location[2] = 0
        lid_u.location[1] = 0
        lid_l.location[2] = 0
        lid_l.location[1] = 0
        
        for bone in (lid_u, lid_l):
            bone.keyframe_insert(data_path="location", frame=end_frame)

def apply_look_side(arm_obj, start_frame, duration=15, side="LEFT"):
    """Darts eye pupils in local space. Pupils move along their X axis."""
    for s in ("L", "R"):
        pupil = arm_obj.pose.bones.get(f"Pupil.Ctrl.{s}")
        if not pupil: continue
        
        pupil.keyframe_insert(data_path="location", frame=start_frame)
        # Assuming X moves left/right relative to face.
        x_shift = 0.03 if side == "LEFT" else -0.03
        pupil.location[0] += x_shift
        pupil.keyframe_insert(data_path="location", frame=start_frame + duration)

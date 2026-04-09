import bpy
import math
import random
import mathutils

# ---------------------------------------------------------------------------
# MODULAR ANIMATION REGISTRY
# ---------------------------------------------------------------------------

def apply_animation_by_tag(arm_obj, tag, start_frame, duration=None, prop_obj=None):
    """Dispatcher to apply animations based on modular tags."""
    # Handle tags with arguments (e.g. "grasp:WaterCan")
    full_tag = tag
    arg = None
    if ":" in tag:
        tag, arg = tag.split(":", 1)
    
    # Default durations if not provided
    registry = {
        "nod": (apply_nod, 24),
        "shake": (apply_shake_head, 45),
        "blink": (apply_blink, 6),
        "smile": (apply_smile, 30),
        "talking": (apply_talking_arms, duration or 60),
        "shiver": (apply_shiver, 48),
        "droop": (apply_droop, 60),
        "stretch": (apply_stretch, 40),
        "wiggle": (apply_wiggle, 40),
        "reach_out": (apply_reach_out, 60),
        "worry": (apply_worry, 40),
        "joyful": (apply_joyful, 40),
        "bend_down": (apply_bend_down, 40),
        "grasp": (apply_grasp, 20),
        "pouring": (apply_pouring, 60),
        "spraying": (apply_spraying, 60),
        "dance": (apply_dance, duration or 600),
    }
    
    if tag in registry:
        func, def_dur = registry[tag]
        dur = duration if duration is not None else def_dur
        
        # Specific handling for prop-based tags
        if tag == "grasp" and prop_obj:
             func(arm_obj, prop_obj, start_frame, duration=dur)
        elif tag in ["pouring", "spraying"] and prop_obj:
             func(arm_obj, prop_obj, start_frame, duration=dur)
        else:
             func(arm_obj, start_frame, duration=dur)
        return True
    return False

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

def apply_talking_arms(arm_obj, start_frame, duration):
    """Expressive arm/hand raising during dialogue."""
    # Find relevant bones
    parts = ["Arm", "Elbow", "Hand"]
    sides = ["L", "R"]
    bones = {}
    for p in parts:
        for s in sides:
            name = f"{p}.{s}"
            b = arm_obj.pose.bones.get(name)
            if b:
                bones[name] = b
                b.rotation_mode = 'XYZ'

    if not bones: return

    end_frame = start_frame + duration

    # 1. Raise arms at the start of dialogue
    for s in ("L", "R"):
        arm = bones.get(f"Arm.{s}")
        elbow = bones.get(f"Elbow.{s}")
        mult = 1 if s == "L" else -1

        if arm:
            # Raise higher (90-110 degrees) - Negative X is forward for downward-pointing bones
            arm.rotation_euler[0] = math.radians(-105)
            # Pull slightly inward
            arm.rotation_euler[2] = math.radians(15 * mult)
            arm.keyframe_insert(data_path="rotation_euler", frame=start_frame)
            arm.keyframe_insert(data_path="rotation_euler", frame=end_frame)
        
        if elbow:
            # Significant bend - Negative X is forward
            elbow.rotation_euler[0] = math.radians(-65)
            elbow.keyframe_insert(data_path="rotation_euler", frame=start_frame)
            elbow.keyframe_insert(data_path="rotation_euler", frame=end_frame)

    # 2. Add expressive 'flutter' during the speech
    curr = start_frame + 5
    while curr < end_frame - 5:
        for s in ("L", "R"):
            arm = bones.get(f"Arm.{s}")
            hand = bones.get(f"Hand.{s}")
            if arm:
                arm.rotation_euler[0] += math.radians(random.uniform(-5, 5))
                arm.rotation_euler[2] += math.radians(random.uniform(-5, 5))
                arm.keyframe_insert(data_path="rotation_euler", frame=curr)
            if hand:
                hand.rotation_euler[0] = math.radians(random.uniform(-15, 15))
                hand.rotation_euler[2] = math.radians(random.uniform(-10, 10))
                hand.keyframe_insert(data_path="rotation_euler", frame=curr)
        curr += random.randint(6, 12)

def apply_shiver(arm_obj, start_frame, duration=30):
    """Adds a high-frequency vibration to the torso to simulate anxiety or cold."""
    torso = arm_obj.pose.bones.get("Torso")
    if not torso: return
    
    for f in range(start_frame, start_frame + duration):
        # Micro-shakes on X/Y/Z
        torso.location[0] = random.uniform(-0.01, 0.01)
        torso.location[1] = random.uniform(-0.01, 0.01)
        torso.location[2] = random.uniform(-0.005, 0.005)
        arm_obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].location', frame=f)
    
    # Reset
    torso.location = (0, 0, 0)
    arm_obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].location', frame=start_frame + duration)

def apply_droop(arm_obj, start_frame, duration=60):
    """Slumps the character's posture (head and neck down)."""
    head = arm_obj.pose.bones.get("Head")
    neck = arm_obj.pose.bones.get("Neck")
    if not (head and neck): return
    
    mid = start_frame + duration // 2
    end = start_frame + duration
    
    for bone in (head, neck):
        bone.rotation_mode = 'XYZ'
        bone.keyframe_insert(data_path="rotation_euler", index=0, frame=start_frame)
        # Droop down (Negative X)
        bone.rotation_euler[0] = math.radians(-25)
        bone.keyframe_insert(data_path="rotation_euler", index=0, frame=mid)
        bone.keyframe_insert(data_path="rotation_euler", index=0, frame=end)

def apply_stretch(arm_obj, start_frame, duration=40):
    """Arching back and stretching arms high."""
    torso = arm_obj.pose.bones.get("Torso")
    head = arm_obj.pose.bones.get("Head")
    if not (torso and head): return
    
    mid = start_frame + duration // 2
    end = start_frame + duration
    
    # Back arch
    torso.rotation_mode = 'XYZ'
    torso.keyframe_insert(data_path="rotation_euler", index=0, frame=start_frame)
    torso.rotation_euler[0] = math.radians(10) # Arch back
    torso.keyframe_insert(data_path="rotation_euler", index=0, frame=mid)
    torso.keyframe_insert(data_path="rotation_euler", index=0, frame=end)
    
    # Head up
    head.rotation_mode = 'XYZ'
    head.keyframe_insert(data_path="rotation_euler", index=0, frame=start_frame)
    head.rotation_euler[0] = math.radians(15) 
    head.keyframe_insert(data_path="rotation_euler", index=0, frame=mid)
    head.keyframe_insert(data_path="rotation_euler", index=0, frame=end)

def apply_wiggle(arm_obj, start_frame, duration=40):
    """Happy rhythmic torso sway."""
    torso = arm_obj.pose.bones.get("Torso")
    if not torso: return
    
    for f in range(start_frame, start_frame + duration, 5):
        torso.rotation_mode = 'XYZ'
        sway = math.radians(5) if (f - start_frame) % 10 == 0 else math.radians(-5)
        torso.rotation_euler[2] = sway # Z sway
        arm_obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].rotation_euler', index=2, frame=f)
    
    torso.rotation_euler[2] = 0
    arm_obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].rotation_euler', index=2, frame=start_frame + duration)

def apply_reach_out(arm_obj, start_frame, duration=60):
    """Extends one arm forward in a gesture of support."""
    arm_l = arm_obj.pose.bones.get("Arm.L")
    if not arm_l: return
    
    mid = start_frame + 20
    end = start_frame + duration
    
    arm_l.rotation_mode = 'XYZ'
    arm_l.keyframe_insert(data_path="rotation_euler", index=0, frame=start_frame)
    arm_l.keyframe_insert(data_path="rotation_euler", index=2, frame=start_frame)
    
    # Extend forward (Positive X) and slightly inward (Negative Z for L arm)
    arm_l.rotation_euler[0] = math.radians(40)
    arm_l.rotation_euler[2] = math.radians(-30)
    arm_l.keyframe_insert(data_path="rotation_euler", index=0, frame=mid)
    arm_l.keyframe_insert(data_path="rotation_euler", index=2, frame=mid)
    
    # Hold then return
    arm_l.keyframe_insert(data_path="rotation_euler", index=0, frame=end - 10)
    arm_l.rotation_euler[0] = math.radians(-40) # Return to A-pose
    arm_l.rotation_euler[2] = math.radians(-40)
    arm_l.keyframe_insert(data_path="rotation_euler", index=0, frame=end)
    arm_l.keyframe_insert(data_path="rotation_euler", index=2, frame=end)

def apply_worry(arm_obj, start_frame, duration=40):
    """Pinches eyebrows and tightens lip corners."""
    brows = [arm_obj.pose.bones.get(f"Eyebrow.{s}") for s in ("L", "R")]
    corners = [arm_obj.pose.bones.get(f"Lip.Corner.Ctrl.{s}") for s in ("L", "R")]
    
    end = start_frame + duration
    
    for b in (brows + corners):
        if not b: continue
        b.keyframe_insert(data_path="location", frame=start_frame)
    
    # Pull brows inward and up
    for s, b in zip(("L", "R"), brows):
        if not b: continue
        x_off = 0.02 if s == "L" else -0.02
        b.location[0] += x_off
        b.location[2] += 0.015
        b.keyframe_insert(data_path="location", frame=start_frame + 10)
        b.keyframe_insert(data_path="location", frame=end)

def apply_joyful(arm_obj, start_frame, duration=40):
    """High eyebrows, wide smile, and dilated pupils."""
    apply_smile(arm_obj, start_frame, duration)
    
    brows = [arm_obj.pose.bones.get(f"Eyebrow.{s}") for s in ("L", "R")]
    pupils = [arm_obj.pose.bones.get(f"Pupil.Ctrl.{s}") for s in ("L", "R")]
    
    end = start_frame + duration
    
    for b in (brows + pupils):
        if not b: continue
        b.keyframe_insert(data_path="location" if "Eyebrow" in b.name else "scale", frame=start_frame)

    # Brows up
    for b in brows:
        if not b: continue
        b.location[2] += 0.04
        b.keyframe_insert(data_path="location", frame=start_frame + 10)
        b.keyframe_insert(data_path="location", frame=end)

    # Pupil dilation
    for b in pupils:
        if not b: continue
        b.scale *= 1.5
        b.keyframe_insert(data_path="scale", frame=start_frame + 10)
        b.keyframe_insert(data_path="scale", frame=end)

def apply_bend_down(arm_obj, start_frame, duration=60):
    """Bends the character down to reach the ground."""
    torso = arm_obj.pose.bones.get("Torso")
    head = arm_obj.pose.bones.get("Head")
    if not (torso and head): return
    
    mid = start_frame + duration // 2
    end = start_frame + duration
    
    torso.rotation_mode = 'XYZ'
    torso.keyframe_insert(data_path="rotation_euler", index=0, frame=start_frame)
    torso.keyframe_insert(data_path="location", index=2, frame=start_frame)
    
    # Pitch forward (Negative X) and lower Z
    torso.rotation_euler[0] = math.radians(-50)
    torso.location[2] -= 0.6
    torso.keyframe_insert(data_path="rotation_euler", index=0, frame=mid)
    torso.keyframe_insert(data_path="location", index=2, frame=mid)
    
    # Stay down until end of duration or return? Let's stay down.
    torso.keyframe_insert(data_path="rotation_euler", index=0, frame=end)
    torso.keyframe_insert(data_path="location", index=2, frame=end)
    
    # Head keeps looking forward
    head.rotation_mode = 'XYZ'
    head.keyframe_insert(data_path="rotation_euler", index=0, frame=start_frame)
    head.rotation_euler[0] = math.radians(40) # Look up while body is down
    head.keyframe_insert(data_path="rotation_euler", index=0, frame=mid)
    head.keyframe_insert(data_path="rotation_euler", index=0, frame=end)

def apply_grasp(arm_obj, start_frame, side="L", duration=30):
    """Curses fingers to grasp an object."""
    fingers = [arm_obj.pose.bones.get(f"Finger.{i}.{side}") for i in range(1, 4)]
    
    for f in fingers:
        if not f: continue
        f.rotation_mode = 'XYZ'
        f.keyframe_insert(data_path="rotation_euler", index=0, frame=start_frame)
        # Curl (Negative X)
        f.rotation_euler[0] = math.radians(-70)
        f.keyframe_insert(data_path="rotation_euler", index=0, frame=start_frame + 10)
        f.keyframe_insert(data_path="rotation_euler", index=0, frame=start_frame + duration)

def attach_prop(arm_obj, prop_obj, bone_name="Hand.L", frame=1):
    """Uses a Child Of constraint to attach a prop to a character bone."""
    # Ensure current frame
    bpy.context.scene.frame_set(frame)
    
    # Remove existing constraints of same name
    const_name = "CharacterGrasp"
    if const_name in prop_obj.constraints:
        prop_obj.constraints.remove(prop_obj.constraints[const_name])
        
    con = prop_obj.constraints.new('CHILD_OF')
    con.name = const_name
    con.target = arm_obj
    con.subtarget = bone_name
    
    # Set Inverse to fix target position at current location
    bpy.context.view_layer.update()
    # Blender doesn't have a simple 'Set Inverse' in API easily without context magic,
    # but we can do it by getting the matrix.
    con.inverse_matrix = (arm_obj.matrix_world @ arm_obj.pose.bones[bone_name].matrix).inverted()
    
    # Keyframe influence
    con.influence = 1.0
    con.keyframe_insert(data_path="influence", frame=frame)

def apply_pouring(prop_obj, start_frame, duration=60):
    """Tilts the prop (e.g. WaterCan) to simulate pouring."""
    prop_obj.rotation_mode = 'XYZ'
    prop_obj.keyframe_insert(data_path="rotation_euler", frame=start_frame)
    
    mid = start_frame + duration // 2
    prop_obj.rotation_euler[0] += math.radians(45) # Tilt forward
    prop_obj.keyframe_insert(data_path="rotation_euler", frame=mid)
    
    prop_obj.keyframe_insert(data_path="rotation_euler", frame=start_frame + duration)

def apply_spraying(prop_obj, start_frame, duration=60):
    """Jitters the prop (e.g. GardenHose) to simulate spraying pressure."""
    prop_obj.rotation_mode = 'XYZ'
    for f in range(start_frame, start_frame + duration, 2):
        prop_obj.rotation_euler[0] += random.uniform(-0.05, 0.05)
        prop_obj.rotation_euler[1] += random.uniform(-0.05, 0.05)
        prop_obj.keyframe_insert(data_path="rotation_euler", frame=f)
def apply_dance(arm_obj, start_frame, duration=600):
    """Synchronized celebratory dance: rhythmic bobbing and side-to-side arm waving."""
    torso = arm_obj.pose.bones.get("Torso")
    arm_l = arm_obj.pose.bones.get("Arm.L")
    arm_r = arm_obj.pose.bones.get("Arm.R")
    if not torso: return
    
    # Rhythmic cycle duration (in frames)
    cycle = 30 
    
    for f in range(start_frame, start_frame + duration, cycle // 2):
        t = (f - start_frame) / cycle
        # 1. Torso Bobbing (Z location)
        # Using sine for smooth vertical movement
        torso.location[2] = 0.05 * math.sin(t * 2 * math.pi)
        arm_obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].location', index=2, frame=f)
        
        # 2. Torso Sway (Z rotation)
        torso.rotation_mode = 'XYZ'
        torso.rotation_euler[2] = math.radians(10) * math.sin(t * math.pi)
        arm_obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].rotation_euler', index=2, frame=f)
        
        # 3. Arm Waving (X rotation)
        if arm_l and arm_r:
            wave = math.radians(30) * math.sin(t * math.pi)
            arm_l.rotation_mode = 'XYZ'
            arm_r.rotation_mode = 'XYZ'
            arm_l.rotation_euler[0] = math.radians(-40) + wave
            arm_r.rotation_euler[0] = math.radians(-40) - wave
            arm_obj.keyframe_insert(data_path=f'pose.bones["{arm_l.name}"].rotation_euler', index=0, frame=f)
            arm_obj.keyframe_insert(data_path=f'pose.bones["{arm_r.name}"].rotation_euler', index=0, frame=f)

    # Reset poses at the end
    end_f = start_frame + duration
    torso.location[2] = 0
    torso.rotation_euler[2] = 0
    arm_obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].location', index=2, frame=end_f)
    arm_obj.keyframe_insert(data_path=f'pose.bones["{torso.name}"].rotation_euler', index=2, frame=end_f)
    if arm_l and arm_r:
        arm_l.rotation_euler[0] = math.radians(-40)
        arm_r.rotation_euler[0] = math.radians(-40)
        arm_obj.keyframe_insert(data_path=f'pose.bones["{arm_l.name}"].rotation_euler', index=0, frame=end_f)
        arm_obj.keyframe_insert(data_path=f'pose.bones["{arm_r.name}"].rotation_euler', index=0, frame=end_f)

import bpy
import math
import random
import config
import base
from registry import registry

# Ported from Movie 6: Bone mapping for cross-rig compatibility (Internal vs Mixamo)
BONE_NAME_MAP = {
    "Head": "mixamorig:Head",
    "Neck": "mixamorig:Neck",
    "Torso": "mixamorig:Spine2",
    "Tail": "mixamorig:Hips",
    "Hand.L": "mixamorig:LeftHand",
    "Hand.R": "mixamorig:RightHand",
    "Foot.L": "mixamorig:LeftFoot",
    "Foot.R": "mixamorig:RightFoot",
    "Leg.L": "mixamorig:LeftUpLeg",
    "Leg.R": "mixamorig:RightUpLeg",
    "Lip.Lower": "Lip.Lower"
}

def get_bone(arm_obj, name):
    """
    Safely retrieves a bone by standard name, mapped Mixamo name, or prefix fallback.
    Ensures that animation logic is decoupled from specific rig naming conventions.
    """
    if not arm_obj or arm_obj.type != 'ARMATURE': return None
    bone = arm_obj.pose.bones.get(name)
    if bone: return bone
    mapped_name = BONE_NAME_MAP.get(name)
    if mapped_name:
        bone = arm_obj.pose.bones.get(mapped_name)
        if bone: return bone
    return arm_obj.pose.bones.get(f"mixamorig:{name}")

class AnimationHandler(base.Animator):
    """Modular Animation Handler with robust procedural application logic."""

    def apply_action(self, rig, tag, frame, params):
        """
        Dispatches to legacy apply_animation for V6 compatibility.
        Feature Kept: Backward compatibility with Movie 6 tagging ensures that
        existing asset pipelines remain functional within the new Movie 9 framework.
        """
        duration = params.get("duration", 100)
        self.apply_animation(rig, tag, frame, duration)

    def apply_animation(self, obj, tag, start_frame, duration=None):
        """Applies an animation to an object based on a tag."""
        if not obj: return
        if not obj.animation_data:
            obj.animation_data_create()

        print(f"Applying animation tag '{tag}' to {obj.name} at frame {start_frame}")

        # Production-grade procedural animation tags matching Movie 6 behaviors
        if tag == "talking":
            self._animate_talking(obj, start_frame, duration or 100)
        elif tag == "idle":
            self._animate_idle(obj, start_frame, duration or 100)
        elif tag == "nod":
            self._animate_nod(obj, start_frame)
        elif tag == "shake":
            self._animate_shake(obj, start_frame)
        elif tag == "dance":
            self._animate_dance(obj, start_frame, duration or 600)
        elif tag == "blink":
            self._animate_blink(obj, start_frame, duration or 6)
        elif tag == "walk":
            self._animate_walk(obj, start_frame, duration or 120)
        elif tag == "shiver":
            self._animate_shiver(obj, start_frame, duration or 48)
        elif tag == "droop":
            self._animate_droop(obj, start_frame, duration or 60)
        elif tag == "smile":
            self._animate_smile(obj, start_frame, duration or 30)
        elif tag == "sit":
            self._animate_sit(obj, start_frame, duration or 40)
        elif tag == "stand":
            self._animate_stand(obj, start_frame, duration or 40)

        # Blender 5.1 Slotted Action Support
        if hasattr(obj.animation_data, "action_slot"):
             print(f"  [5.1] Using action slot for {obj.name}")

    def _animate_talking(self, obj, start, duration):
        """
        Procedural talking animation matching Movie 6 standards.
        Feature Kept: The sine-based head tilt for talking is a reliable and
        computationally inexpensive way to represent verbal communication.
        """
        if obj.type != 'ARMATURE': return
        bone = get_bone(obj, "Head") or get_bone(obj, "Lip.Lower")
        if not bone: return

        for f in range(start, start + duration):
            val = math.sin(f * 0.5) * 0.05
            bone.rotation_euler[0] = val
            bone.keyframe_insert(data_path="rotation_euler", index=0, frame=f)

    def _animate_idle(self, obj, start, duration):
        """
        Subtle organic breathing sway.
        Feature Kept: Ported from Movie 9 to provide secondary motion and
        prevent characters from appearing static when not performing primary actions.
        """
        if obj.type != 'ARMATURE': return
        bone = get_bone(obj, "Torso")
        if not bone: return

        for f in range(start, start + duration, 10):
            val = math.sin(f * 0.1) * 0.02
            bone.location[2] = val
            bone.keyframe_insert(data_path="location", index=2, frame=f)

    def _animate_nod(self, obj, start):
        """Short affirmative head nod."""
        if obj.type != 'ARMATURE': return
        bone = get_bone(obj, "Head")
        if not bone: return

        bone.rotation_euler[0] = 0
        bone.keyframe_insert(data_path="rotation_euler", index=0, frame=start)
        bone.rotation_euler[0] = math.radians(15)
        bone.keyframe_insert(data_path="rotation_euler", index=0, frame=start + 10)
        bone.rotation_euler[0] = 0
        bone.keyframe_insert(data_path="rotation_euler", index=0, frame=start + 20)

    def _animate_shake(self, obj, start):
        """Short negative head shake."""
        if obj.type != 'ARMATURE': return
        bone = get_bone(obj, "Head")
        if not bone: return

        bone.rotation_euler[2] = 0
        bone.keyframe_insert(data_path="rotation_euler", index=2, frame=start)
        bone.rotation_euler[2] = math.radians(10)
        bone.keyframe_insert(data_path="rotation_euler", index=2, frame=start + 5)
        bone.rotation_euler[2] = math.radians(-10)
        bone.keyframe_insert(data_path="rotation_euler", index=2, frame=start + 15)
        bone.rotation_euler[2] = 0
        bone.keyframe_insert(data_path="rotation_euler", index=2, frame=start + 20)

    def _animate_dance(self, obj, start, duration):
        """Rhythmic bobbing."""
        if obj.type != 'ARMATURE': return
        torso = get_bone(obj, "Torso")
        hip = get_bone(obj, "Tail")
        if not torso: return

        for f in range(start, start + duration, 4):
            phase = (f - start) * 0.1
            torso.location[2] = math.sin(phase) * 0.1
            torso.keyframe_insert(data_path="location", index=2, frame=f)

            if hip:
                hip.location[1] = math.cos(phase) * 0.05
                hip.keyframe_insert(data_path="location", index=1, frame=f)

    def _animate_blink(self, obj, start, duration):
        """
        Eye blinking animation.
        Emotional Accuracy: Rapid blinking can indicate high cognitive load or surprise.
        """
        for child in obj.children:
            if "Eye" in child.name:
                child.scale[2] = 1.0
                child.keyframe_insert(data_path="scale", index=2, frame=start)
                child.scale[2] = 0.1
                child.keyframe_insert(data_path="scale", index=2, frame=start + (duration//2))
                child.scale[2] = 1.0
                child.keyframe_insert(data_path="scale", index=2, frame=start + duration)

    def _animate_arm_swing(self, obj, bone_name, frame, phase, amplitude=0.4):
        """Helper to create rhythmic arm swings."""
        bone = get_bone(obj, bone_name)
        if bone:
            val = math.sin(phase * 2 * math.pi) * amplitude
            bone.rotation_euler[0] = val
            bone.keyframe_insert(data_path=f'pose.bones["{bone.name}"].rotation_euler', index=0, frame=frame)

    def _animate_leg_stride(self, obj, bone_name, frame, phase, amplitude=0.4):
        """Helper to create rhythmic leg strides."""
        bone = get_bone(obj, bone_name)
        if bone:
            val = math.cos(phase * 2 * math.pi) * amplitude
            bone.rotation_euler[0] = val
            bone.keyframe_insert(data_path=f'pose.bones["{bone.name}"].rotation_euler', index=0, frame=frame)

    def _animate_walk(self, obj, start, duration):
        """
        Coordinated walk cycle with independent limb movement.
        Conceptual Translation: A steady walk represents purposeful cognitive progression and stability.
        """
        if obj.type != 'ARMATURE': return
        cycle_len = 40
        step_h = 0.1

        for f in range(start, start + duration, 5):
            phase = ((f - start) % cycle_len) / cycle_len

            # Torso bob
            torso = get_bone(obj, "Torso")
            if torso:
                torso.location[2] = abs(math.sin(phase * 2 * math.pi)) * step_h
                torso.keyframe_insert(data_path=f'pose.bones["{torso.name}"].location', index=2, frame=f)

            # Coordinate Limbs
            self._animate_leg_stride(obj, "Leg.L", f, phase, 0.4)
            self._animate_leg_stride(obj, "Leg.R", f, phase + 0.5, 0.4)
            self._animate_arm_swing(obj, "Hand.L", f, phase + 0.5, 0.3)
            self._animate_arm_swing(obj, "Hand.R", f, phase, 0.3)

    def _animate_shiver(self, obj, start, duration):
        """
        High-frequency vibration to simulate anxiety or cold.
        Emotional Accuracy: Anxiety is represented by chaotic, high-frequency motion.
        """
        torso = get_bone(obj, "Torso")
        if not torso: return
        for f in range(start, start + duration, 2):
            torso.location[0] = (random.random() - 0.5) * 0.02
            torso.location[1] = (random.random() - 0.5) * 0.02
            torso.keyframe_insert(data_path=f'pose.bones["{torso.name}"].location', index=0, frame=f)
            torso.keyframe_insert(data_path=f'pose.bones["{torso.name}"].location', index=1, frame=f)

    def _animate_droop(self, obj, start, duration):
        """
        Slumps the character's posture (head and neck down).
        Emotional Accuracy: Depression or low energy is reflected in muted, downward-trending forms.
        """
        head = get_bone(obj, "Head")
        neck = get_bone(obj, "Neck")
        if not (head and neck): return

        orig_h_x = head.rotation_euler[0]
        orig_n_x = neck.rotation_euler[0]

        head.rotation_euler[0] = orig_h_x + math.radians(20)
        neck.rotation_euler[0] = orig_n_x + math.radians(10)

        head.keyframe_insert(data_path=f'pose.bones["{head.name}"].rotation_euler', index=0, frame=start + duration // 2)
        neck.keyframe_insert(data_path=f'pose.bones["{neck.name}"].rotation_euler', index=0, frame=start + duration // 2)

    def _animate_smile(self, obj, start, duration):
        """
        Ported from Movie 5: Subtle upward tilt for positivity.
        Emotional Accuracy: Calm and Joy are represented by smooth, upward-trending gradients and motion.
        """
        head = get_bone(obj, "Head")
        if not head: return
        head.rotation_euler[0] -= math.radians(5)
        head.keyframe_insert(data_path=f'pose.bones["{head.name}"].rotation_euler', index=0, frame=start + duration)

    def _animate_sit(self, obj, start, duration):
        """
        Coordinated bending of the lower body to achieve a natural seated posture.
        Emotional Accuracy: Sitting represents a transition from external action to internal
        processing and stability.
        """
        if obj.type != 'ARMATURE': return
        pb = obj.pose.bones

        # 1. Torso lower and lean
        torso = get_bone(obj, "Torso")
        if torso:
            torso.location[2] = -0.6
            torso.rotation_euler[0] = math.radians(-10) # Slight forward lean
            torso.keyframe_insert(data_path="location", index=2, frame=start + duration)
            torso.keyframe_insert(data_path="rotation_euler", index=0, frame=start + duration)

        # 2. Thighs up (90 degrees)
        for side in ["L", "R"]:
            thigh = get_bone(obj, f"Leg.{side}")
            if thigh:
                thigh.rotation_euler[0] = math.radians(90)
                thigh.keyframe_insert(data_path="rotation_euler", index=0, frame=start + duration)

            # 3. Knees back (90 degrees)
            # Knee bone name in Movie 9 plant rig is derived from standard naming
            knee = get_bone(obj, f"Knee.{side}")
            if knee:
                knee.rotation_euler[0] = math.radians(-90)
                knee.keyframe_insert(data_path="rotation_euler", index=0, frame=start + duration)

    def _animate_stand(self, obj, start, duration):
        """Resets the bone rotations to a standard upright posture."""
        if obj.type != 'ARMATURE': return
        # Simply keyframe identity transforms
        for b in obj.pose.bones:
            b.location = (0,0,0)
            b.rotation_euler = (0,0,0)
            b.keyframe_insert(data_path="location", frame=start + duration)
            b.keyframe_insert(data_path="rotation_euler", frame=start + duration)

    def loop_animation(self, obj, action_name, start, duration):
        """
        Standard NLA-based looping implementation.
        Feature Kept: NLA track management is the most robust way to handle
        repeating animations like walks or idle cycles in Blender's production environment.
        """
        action = bpy.data.actions.get(action_name)
        if not action or not obj.animation_data: return

        track = obj.animation_data.nla_tracks.new()
        strip = track.strips.new(action.name, start, action)
        strip.repeat = duration / (action.frame_range[1] - action.frame_range[0])

registry.register_animation("AnimationHandler", AnimationHandler)
registry.register_animation("ProceduralAnimator", AnimationHandler)

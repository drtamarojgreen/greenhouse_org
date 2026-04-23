import bpy
import math
import config

BONE_NAME_MAP = {
    "Head": "mixamorig:Head",
    "Neck": "mixamorig:Neck",
    "Torso": "mixamorig:Spine2",
    "Tail": "mixamorig:Hips",
    "Hand.L": "mixamorig:LeftHand",
    "Hand.R": "mixamorig:RightHand",
    "Foot.L": "mixamorig:LeftFoot",
    "Foot.R": "mixamorig:RightFoot",
    "Lip.Lower": "Lip.Lower"
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

class AnimationHandler:
    """Modular Animation Handler with robust procedural application logic."""

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

        # Blender 5.1 Slotted Action Support
        if hasattr(obj.animation_data, "action_slot"):
             print(f"  [5.1] Using action slot for {obj.name}")

    def _animate_talking(self, obj, start, duration):
        """Procedural talking animation matching Movie 6 standards."""
        if obj.type != 'ARMATURE': return
        bone = get_bone(obj, "Head") or get_bone(obj, "Lip.Lower")
        if not bone: return

        for f in range(start, start + duration):
            val = math.sin(f * 0.5) * 0.05
            bone.rotation_euler[0] = val
            bone.keyframe_insert(data_path="rotation_euler", index=0, frame=f)

    def _animate_idle(self, obj, start, duration):
        """Subtle organic breathing sway."""
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
        """Eye blinking animation."""
        for child in obj.children:
            if "Eye" in child.name:
                child.scale[2] = 1.0
                child.keyframe_insert(data_path="scale", index=2, frame=start)
                child.scale[2] = 0.1
                child.keyframe_insert(data_path="scale", index=2, frame=start + (duration//2))
                child.scale[2] = 1.0
                child.keyframe_insert(data_path="scale", index=2, frame=start + duration)

    def loop_animation(self, obj, action_name, start, duration):
        """Standard NLA-based looping implementation."""
        action = bpy.data.actions.get(action_name)
        if not action or not obj.animation_data: return

        track = obj.animation_data.nla_tracks.new()
        strip = track.strips.new(action.name, start, action)
        strip.repeat = duration / (action.frame_range[1] - action.frame_range[0])

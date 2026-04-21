import bpy
import math
from .config import config

class AnimationHandler:
    """Modular Animation Handler with functional application logic."""

    def apply_animation(self, obj, tag, start_frame, duration=None):
        """Applies an animation to an object based on a tag."""
        if not obj: return
        if not obj.animation_data:
            obj.animation_data_create()

        print(f"Applying animation tag '{tag}' to {obj.name} at frame {start_frame}")

        # In a production system, this would map tags to specific procedural
        # functions or Actions. Here we implement a few standard procedural tags.
        if tag == "talking":
            self._animate_talking(obj, start_frame, duration or 100)
        elif tag == "idle":
            self._animate_idle(obj, start_frame, duration or 100)

        # Blender 5.1 Slotted Action Support
        if hasattr(obj.animation_data, "action_slot"):
             print(f"  [5.1] Using action slot for {obj.name}")

    def _animate_talking(self, obj, start, duration):
        """Procedural jaw/head bobbing for talking."""
        if obj.type != 'ARMATURE': return
        bone = obj.pose.bones.get("Head") or obj.pose.bones.get("Lip.Lower")
        if not bone: return

        for f in range(start, start + duration):
            # Deterministic sine wave for talking motion
            val = math.sin(f * 0.5) * 0.05
            bone.rotation_euler[0] = val
            bone.keyframe_insert(data_path="rotation_euler", index=0, frame=f)

    def _animate_idle(self, obj, start, duration):
        """Subtle breathing/sway."""
        if obj.type != 'ARMATURE': return
        bone = obj.pose.bones.get("Torso")
        if not bone: return

        for f in range(start, start + duration):
            val = math.sin(f * 0.1) * 0.02
            bone.location[2] = val
            bone.keyframe_insert(data_path="location", index=2, frame=f)

    def loop_animation(self, obj, action_name, start, duration):
        """Loops a specific Action over a duration."""
        action = bpy.data.actions.get(action_name)
        if not action or not obj.animation_data: return

        # Simple NLA-based looping could be implemented here
        track = obj.animation_data.nla_tracks.new()
        strip = track.strips.new(action.name, start, action)
        strip.repeat = duration / (action.frame_range[1] - action.frame_range[0])

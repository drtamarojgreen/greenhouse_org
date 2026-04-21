import bpy
import math
from ..base import Animator
from ..registry import registry

class PlantAnimator(Animator):
    """Production animations ported from Movie 6."""
    def apply_action(self, rig, tag, frame, params):
        if not rig: return
        if not rig.animation_data: rig.animation_data_create()
        duration = params.get("duration", 100)

        if tag == "talking":
            self._animate_bone(rig, "Head", "rotation_euler", 0, math.sin, 0.5, 0.05, frame, duration)
        elif tag == "idle":
            self._animate_bone(rig, "Torso", "location", 2, math.sin, 0.1, 0.02, frame, duration)

    def _animate_bone(self, rig, bone_name, path, index, func, freq, amp, start, duration):
        bone = rig.pose.bones.get(bone_name)
        if not bone: return
        for f in range(start, start + duration):
            val = func(f * freq) * amp
            if path == "rotation_euler":
                bone.rotation_euler[index] = val
            elif path == "location":
                bone.location[index] = val
            # Use relative data path when calling on PoseBone object
            bone.keyframe_insert(data_path=path, index=index, frame=f)

registry.register_animation("PlantAnimator", PlantAnimator)

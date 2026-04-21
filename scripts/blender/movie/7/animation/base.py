import bpy
import math

class Action:
    def apply(self, rig, frame, duration, params): raise NotImplementedError()

class ProceduralAction(Action):
    def _animate(self, rig, bone_name, path, index, func, freq, amp, start, duration):
        bone = rig.pose.bones.get(bone_name)
        if not bone: return
        for f in range(start, start + duration):
            val = func(f * freq) * amp
            if path == "rotation_euler": bone.rotation_euler[index] = val
            elif path == "location": bone.location[index] = val
            bone.keyframe_insert(data_path=path, index=index, frame=f)

class Animator:
    def apply_action(self, rig, tag, frame, params): raise NotImplementedError()

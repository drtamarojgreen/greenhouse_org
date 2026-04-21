import bpy
import math
try:
    from animation.base import Animator, Action, ProceduralAction
    from registry import registry
except ImportError:
    from .base import Animator, Action, ProceduralAction
    from ..registry import registry

class TalkingAction(ProceduralAction):
    def apply(self, rig, frame, duration, params):
        self._animate(rig, "Head", "rotation_euler", 0, math.sin, 0.5, 0.05, frame, duration)

class IdleAction(ProceduralAction):
    def apply(self, rig, frame, duration, params):
        self._animate(rig, "Torso", "location", 2, math.sin, 0.1, 0.02, frame, duration)

class NodAction(ProceduralAction):
    def apply(self, rig, frame, duration, params):
        bone = rig.pose.bones.get("Head")
        if not bone: return
        bone.rotation_euler[0] = 0; bone.keyframe_insert(data_path="rotation_euler", index=0, frame=frame)
        bone.rotation_euler[0] = math.radians(15); bone.keyframe_insert(data_path="rotation_euler", index=0, frame=frame + 10)
        bone.rotation_euler[0] = 0; bone.keyframe_insert(data_path="rotation_euler", index=0, frame=frame + 20)

class ShakeAction(ProceduralAction):
    def apply(self, rig, frame, duration, params):
        bone = rig.pose.bones.get("Head")
        if not bone: return
        bone.rotation_euler[2] = 0; bone.keyframe_insert(data_path="rotation_euler", index=2, frame=frame)
        bone.rotation_euler[2] = math.radians(10); bone.keyframe_insert(data_path="rotation_euler", index=2, frame=frame + 5)
        bone.rotation_euler[2] = math.radians(-10); bone.keyframe_insert(data_path="rotation_euler", index=2, frame=frame + 15)
        bone.rotation_euler[2] = 0; bone.keyframe_insert(data_path="rotation_euler", index=2, frame=frame + 20)

class PlantAnimator(Animator):
    def __init__(self):
        self.actions = {"talking": TalkingAction(), "idle": IdleAction(), "nod": NodAction(), "shake": ShakeAction()}
    def apply_action(self, rig, tag, frame, params):
        if not rig: return
        if not rig.animation_data: rig.animation_data_create()
        action = self.actions.get(tag)
        if action: action.apply(rig, frame, params.get("duration", 100), params)

registry.register_animation("PlantAnimator", PlantAnimator)

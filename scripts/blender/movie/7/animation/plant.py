import bpy
import math
import os
import sys

# Ensure Movie 7 root is in sys.path
M7_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M7_ROOT not in sys.path:
    sys.path.insert(0, M7_ROOT)

from base import Animator, Action, ProceduralAction
from registry import registry

class TalkingAction(ProceduralAction):
    def apply(self, rig, frame, duration, params):
        bone = rig.pose.bones.get("Head")
        if not bone: return
        for f in range(frame, frame + duration):
            bone.rotation_euler[0] = math.sin(f * 0.5) * 0.05; bone.keyframe_insert(data_path="rotation_euler", index=0, frame=f)

class IdleAction(ProceduralAction):
    def apply(self, rig, frame, duration, params):
        bone = rig.pose.bones.get("Torso")
        if not bone: return
        for f in range(frame, frame + duration):
            bone.location[2] = math.sin(f * 0.1) * 0.02; bone.keyframe_insert(data_path="location", index=2, frame=f)

class PlantAnimator(Animator):
    def __init__(self): self.actions = {"talking": TalkingAction(), "idle": IdleAction()}
    def apply_action(self, rig, tag, frame, params):
        if not rig: return
        if not rig.animation_data: rig.animation_data_create()
        a = self.actions.get(tag)
        if a: a.apply(rig, frame, params.get("duration", 100), params)

registry.register_animation("PlantAnimator", PlantAnimator)

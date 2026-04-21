import bpy
import math
from base import Animator, Action, ProceduralAction
from registry import registry

class TalkingAction(ProceduralAction):
    def apply(self, rig, frame, duration, params):
        self._animate(rig, "Head", "rotation_euler", 0, math.sin, 0.5, 0.05, frame, duration)

class IdleAction(ProceduralAction):
    def apply(self, rig, frame, duration, params):
        self._animate(rig, "Torso", "location", 2, math.sin, 0.1, 0.02, frame, duration)

class PlantAnimator(Animator):
    def __init__(self): self.actions = {"talking": TalkingAction(), "idle": IdleAction()}
    def apply_action(self, rig, tag, frame, params):
        if not rig: return
        if not rig.animation_data: rig.animation_data_create()
        a = self.actions.get(tag)
        if a: a.apply(rig, frame, params.get("duration", 100), params)

registry.register_animation("PlantAnimator", PlantAnimator)

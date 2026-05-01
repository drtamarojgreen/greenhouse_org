import bpy
import math
from base import Animator, Action, ProceduralAction
from registry import registry

class ConfigurableAction(ProceduralAction):
    """Action that takes all its parameters from the config."""
    def apply(self, rig, frame, duration, params):
        bone_name = params.get("bone")
        if not bone_name: return

        freq = params.get("freq", 0.5)
        amp = params.get("amp", 0.05)
        path = params.get("path", "rotation_euler")
        index = params.get("index", 0)

        self._animate(rig, bone_name, path, index, math.sin, freq, amp, frame, duration)

class ProceduralAnimator(Animator):
    """
    Animator that dispatches to procedural functions based on tags.
    Architecture Kept: Tag-based dispatch allows for a high degree of
    reusability and decoupling between the Director's high-level events and
    the specific bone-level animation logic.
    """

    def apply_action(self, rig, tag, frame, params):
        anim_cfg = params.get("animation", {})
        action_cfg = anim_cfg.get(tag)

        if not action_cfg:
            return

        if not rig.animation_data:
            rig.animation_data_create()

        action = ConfigurableAction()
        duration = action_cfg.get("duration", params.get("duration", 100))
        action.apply(rig, frame, duration, action_cfg)

registry.register_animation("ProceduralAnimator", ProceduralAnimator)

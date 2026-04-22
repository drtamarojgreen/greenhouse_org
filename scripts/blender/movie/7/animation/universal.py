import bpy
import math
from base import Animator, Action, ProceduralAction
from registry import registry

class ConfigurableAction(ProceduralAction):
    """Action that takes all its parameters from the config."""
    def apply(self, rig, frame, duration, params):
        # params here is the specific action config (e.g. 'talking' dict)
        bone_name = params.get("bone")
        if not bone_name: return

        freq = params.get("freq", 0.5)
        amp = params.get("amp", 0.05)
        path = params.get("path", "rotation_euler")
        index = params.get("index", 0)

        self._animate(rig, bone_name, path, index, math.sin, freq, amp, frame, duration)

class ProceduralAnimator(Animator):
    """Animator that executes actions defined in the configuration."""

    def apply_action(self, rig, tag, frame, params):
        # params here is the full character parameters dict
        anim_cfg = params.get("animation", {})
        action_cfg = anim_cfg.get(tag)

        if not action_cfg:
            print(f"Warning: No animation config for tag '{tag}'")
            return

        if not rig.animation_data:
            rig.animation_data_create()

        action = ConfigurableAction()
        duration = action_cfg.get("duration", params.get("duration", 100))
        action.apply(rig, frame, duration, action_cfg)

registry.register_animation("ProceduralAnimator", ProceduralAnimator)

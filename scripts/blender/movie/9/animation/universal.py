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
    """
    def apply_action(self, rig, tag, frame, params):
        anim_cfg = params.get("animation", {})
        action_cfg = anim_cfg.get(tag)
        if not action_cfg: return
        if not rig.animation_data: rig.animation_data_create()
        action = ConfigurableAction()
        duration = action_cfg.get("duration", params.get("duration", 100))
        action.apply(rig, frame, duration, action_cfg)

class BakedAnimator(Animator):
    """
    Animator that switches between pre-authored (baked) actions linked from assets.
    """
    def apply_action(self, rig, tag, frame, params):
        if not rig.animation_data: rig.animation_data_create()
        
        # Prioritize explicit mapping, then character-scoped action naming.
        action_name = params.get("action_name")
        candidates = []
        if action_name:
            candidates.append(action_name)
        base_name = rig.name.replace(".Rig", "")
        candidates.extend([f"{base_name}_{tag}", f"{base_name}.{tag}", tag])

        action = next((bpy.data.actions.get(name) for name in candidates if bpy.data.actions.get(name)), None)
        if not action:
            # Fuzzy match
            action = next((a for a in bpy.data.actions if tag.lower() in a.name.lower()), None)
        
        if action:
            rig.animation_data.action = action
            print(f"DEBUG: Applied baked action {action.name} to {rig.name}")
        else:
            print(f"WARNING: Baked action '{tag}' not found for {rig.name}")

registry.register_animation("ProceduralAnimator", ProceduralAnimator)
registry.register_animation("BakedAnimator", BakedAnimator)

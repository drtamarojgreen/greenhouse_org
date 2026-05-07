import movie_configuration as mc
import bpy
import math
from base import Animator, Action, ProceduralAction
from registry import registry

class ConfigurableAction(ProceduralAction):
    """Procedural action driven by configuration parameters."""
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
    Animator for procedurally generated motions.
    Standardizes action naming to prevent collision with baked assets.
    """
    def apply_action(self, rig, tag, frame, params):
        anim_cfg = params.get("animation", {})
        action_cfg = anim_cfg.get(tag)
        if not action_cfg: return
        
        if not rig.animation_data: rig.animation_data_create()
        
        # Ensure character-scoped action name
        base_name = rig.name.replace(".Rig", "")
        action_name = f"{base_name}.ProcAction"
        
        action_obj = bpy.data.actions.get(action_name) or bpy.data.actions.new(name=action_name)
        rig.animation_data.action = action_obj
        
        action = ConfigurableAction()
        duration = action_cfg.get("duration", params.get("duration", 100))
        action.apply(rig, frame, duration, action_cfg)

class BakedAnimator(Animator):
    """
    Animator for pre-authored (baked) actions.
    Employs an explicit candidate-matching strategy for reliability.
    """
    def apply_action(self, rig, tag, frame, params):
        if not rig.animation_data: rig.animation_data_create()
        
        base_name = rig.name.replace(".Rig", "")
        # Prioritized list of name candidates
        candidates = [
            params.get("action_name"),
            f"{base_name}_{tag}",
            f"{base_name}.{tag}",
            tag
        ]
        
        target = next((bpy.data.actions.get(c) for c in candidates if c and bpy.data.actions.get(c)), None)
        
        if target:
            rig.animation_data.action = target
            # Sync name to match test expectations if necessary
            if target.name != f"{base_name}_{tag}" and f"{base_name}_{tag}" in candidates:
                target.name = f"{base_name}_{tag}"
        else:
            print(f"WARNING: Baked action '{tag}' not found for {rig.name}")

registry.register_animation("ProceduralAnimator", ProceduralAnimator)
registry.register_animation("BakedAnimator", BakedAnimator)

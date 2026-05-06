import bpy
import math
import random
import config
import base
from registry import registry

# Ported from Movie 6: Bone mapping for cross-rig compatibility (Internal vs Mixamo)
def get_bone(arm_obj, name):
    """
    Safely retrieves a bone by standard name, mapped Mixamo name, or prefix fallback.
    Ensures that animation logic is decoupled from specific rig naming conventions.
    """
    if not arm_obj or arm_obj.type != 'ARMATURE': return None
    bone = arm_obj.pose.bones.get(name)
    if bone: return bone

    bone_map = config.config.get("animations.bone_name_map", {})
    mapped_name = bone_map.get(name)
    if mapped_name:
        bone = arm_obj.pose.bones.get(mapped_name)
        if bone: return bone
    return arm_obj.pose.bones.get(f"mixamorig:{name}")

from animation import talking, movement, gestures
import importlib

class AnimationHandler(base.Animator):
    """Modular Animation Handler with robust procedural application logic."""

    def apply_action(self, rig, tag, frame, params):
        duration = params.get("duration", 100)
        self.apply_animation(rig, tag, frame, duration)

    def apply_animation(self, obj, tag, start_frame, duration=None):
        if not obj: return
        if not obj.animation_data: obj.animation_data_create()

        # Data-driven dispatch to modular sub-packages
        cfg = config.config.get(f"animations.tag_mappings.{tag}")
        if cfg:
            mapping = cfg.get("func")
            sig = cfg.get("signature", "standard")
            parts = mapping.split(".")
            module_path = ".".join(parts[:-1])
            func_name = parts[-1]

            try:
                module = importlib.import_module(module_path)
                func = getattr(module, func_name)

                if sig == "fixed_duration":
                    func(obj, start_frame, get_bone)
                elif sig == "blink":
                    func(obj, start_frame, duration or 6)
                else: # standard
                    func(obj, start_frame, duration or 100, get_bone)
            except (ImportError, AttributeError) as e:
                print(f"ERROR: Could not dispatch animation '{tag}' to {mapping}: {e}")
        else:
            print(f"WARNING: No animation mapping found for tag '{tag}'")

        # Blender 5.1 Slotted Action Support
        if hasattr(obj.animation_data, "action_slot"):
             print(f"  [5.1] Using action slot for {obj.name}")

    def loop_animation(self, obj, action_name, start, duration):
        """Generic looping logic for pre-baked actions."""
        if not obj.animation_data: obj.animation_data_create()
        action = bpy.data.actions.get(action_name)
        if action:
            obj.animation_data.action = action
            # Simple offset keying (could be improved with NLA)
            obj.keyframe_insert(data_path="location", frame=start)

registry.register_animation("AnimationHandler", AnimationHandler)
registry.register_animation("ProceduralAnimator", AnimationHandler)

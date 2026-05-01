import bpy
import math
import random
import config
import base
from registry import registry

# Ported from Movie 6: Bone mapping for cross-rig compatibility (Internal vs Mixamo)
BONE_NAME_MAP = {
    "Head": "mixamorig:Head",
    "Neck": "mixamorig:Neck",
    "Torso": "mixamorig:Spine2",
    "Tail": "mixamorig:Hips",
    "Hand.L": "mixamorig:LeftHand",
    "Hand.R": "mixamorig:RightHand",
    "Foot.L": "mixamorig:LeftFoot",
    "Foot.R": "mixamorig:RightFoot",
    "Leg.L": "mixamorig:LeftUpLeg",
    "Leg.R": "mixamorig:RightUpLeg",
    "Lip.Lower": "Lip.Lower",
    "Lip.Corner.Ctrl.L": "Lip.Corner.Ctrl.L",
    "Lip.Corner.Ctrl.R": "Lip.Corner.Ctrl.R",
    "Jaw.Ctrl": "Jaw.Ctrl",
    "Pupil.Ctrl.L": "Pupil.Ctrl.L",
    "Pupil.Ctrl.R": "Pupil.Ctrl.R",
    "Eyelid.Ctrl.Upper.L": "Eyelid.Ctrl.Upper.L",
    "Eyelid.Ctrl.Upper.R": "Eyelid.Ctrl.Upper.R",
    "Eyelid.Ctrl.Lower.L": "Eyelid.Ctrl.Lower.L",
    "Eyelid.Ctrl.Lower.R": "Eyelid.Ctrl.Lower.R"
}

def get_bone(arm_obj, name):
    """
    Safely retrieves a bone by standard name, mapped Mixamo name, or prefix fallback.
    Ensures that animation logic is decoupled from specific rig naming conventions.
    """
    if not arm_obj or arm_obj.type != 'ARMATURE': return None
    bone = arm_obj.pose.bones.get(name)
    if bone: return bone
    mapped_name = BONE_NAME_MAP.get(name)
    if mapped_name:
        bone = arm_obj.pose.bones.get(mapped_name)
        if bone: return bone
    return arm_obj.pose.bones.get(f"mixamorig:{name}")

from animation import talking, movement, gestures

class AnimationHandler(base.Animator):
    """Modular Animation Handler with robust procedural application logic."""

    def apply_action(self, rig, tag, frame, params):
        duration = params.get("duration", 100)
        self.apply_animation(rig, tag, frame, duration)

    def apply_animation(self, obj, tag, start_frame, duration=None):
        if not obj: return
        if not obj.animation_data: obj.animation_data_create()

        # Dispatch to modular sub-packages
        if tag == "talking":
            talking.animate_talking(obj, start_frame, duration or 100, get_bone)
        elif tag == "idle":
            gestures.animate_idle(obj, start_frame, duration or 100, get_bone)
        elif tag == "nod":
            gestures.animate_nod(obj, start_frame, get_bone)
        elif tag == "shake":
            gestures.animate_shake(obj, start_frame, get_bone)
        elif tag == "dance":
            gestures.animate_dance(obj, start_frame, duration or 600, get_bone)
        elif tag == "blink":
            gestures.animate_blink(obj, start_frame, duration or 6)
        elif tag == "walk":
            movement.animate_walk(obj, start_frame, duration or 120, get_bone)
        elif tag == "shiver":
            gestures.animate_shiver(obj, start_frame, duration or 48, get_bone)
        elif tag == "smile":
            talking.animate_smile(obj, start_frame, duration or 30, get_bone)
        elif tag == "sit":
            movement.animate_sit(obj, start_frame, duration or 40, get_bone)
        elif tag == "stand":
            movement.animate_stand(obj, start_frame, duration or 40, get_bone)
        elif tag == "climb":
            movement.animate_climb(obj, start_frame, duration or 100, get_bone)

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

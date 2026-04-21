import bpy
import math
from .base import Rigger
from ..registry import registry

class PlantRigger(Rigger):
    """High-fidelity character rigging ported from Movie 6 standards."""

    def build_rig(self, char_id, params):
        arm_data = bpy.data.armatures.new(f"{char_id}_ArmData")
        rig = bpy.data.objects.new(f"{char_id}.Rig", arm_data)
        bpy.context.scene.collection.objects.link(rig)

        bpy.context.view_layer.objects.active = rig
        bpy.ops.object.mode_set(mode='EDIT')

        dims = params.get("dimensions", {})
        th, hr, nh = dims.get("torso_h", 1.5), dims.get("head_r", 0.4), dims.get("neck_h", 0.2)
        hcz = th + nh + hr

        bones = {
            "Torso": ((0,0,0), (0,0,th), None),
            "Neck":  ((0,0,th), (0,0,th+nh), "Torso"),
            "Head":  ((0,0,th+nh), (0,0,th+nh+hr*2), "Neck")
        }

        for side, sx in [("L", 1), ("R", -1)]:
            # Limbs
            bones[f"Arm.{side}"] = ((0.4*sx, 0, th*0.9), (0.4*sx, 0, th*0.9-0.4), "Torso")
            bones[f"Elbow.{side}"] = ((0.4*sx, 0, th*0.9-0.4), (0.4*sx, 0, th*0.9-0.8), f"Arm.{side}")
            bones[f"Hand.{side}"] = ((0.4*sx, 0, th*0.9-0.8), (0.4*sx, 0, th*0.9-0.95), f"Elbow.{side}")
            bones[f"Thigh.{side}"] = ((0.25*sx, 0, 0.1), (0.25*sx, 0, -0.4), "Torso")
            bones[f"Knee.{side}"] = ((0.25*sx, 0, -0.4), (0.25*sx, 0, -0.9), f"Thigh.{side}")
            bones[f"Foot.{side}"] = ((0.25*sx, 0, -0.9), (0.25*sx, -0.15, -0.95), f"Knee.{side}")

            # Facial (Ported from v6)
            bones[f"Eye.{side}"] = ((sx*0.14, -hr*0.84, hcz+hr*0.35), (sx*0.14, -hr*0.92, hcz+hr*0.35), "Head")
            bones[f"Eyelid.Upper.{side}"] = ((sx*0.14, -hr*0.84, hcz+hr*0.4), (sx*0.14, -hr*0.92, hcz+hr*0.4), "Head")
            bones[f"Eyelid.Lower.{side}"] = ((sx*0.14, -hr*0.84, hcz+hr*0.3), (sx*0.14, -hr*0.92, hcz+hr*0.3), "Head")
            bones[f"Ear.{side}"] = ((sx*hr*0.9, 0, hcz), (sx*hr*1.1, 0, hcz+0.1), "Head")

        bones["Nose"] = ((0, -hr*0.97, hcz+hr*0.05), (0, -hr*1.07, hcz+hr*0.05), "Head")
        bones["Lip.Upper"] = ((0, -hr*0.96, hcz-hr*0.18), (0, -hr*1.06, hcz-hr*0.18), "Head")
        bones["Lip.Lower"] = ((0, -hr*0.95, hcz-hr*0.24), (0, -hr*1.05, hcz-hr*0.24), "Head")
        bones["Chin"] = ((0, -hr*0.38, hcz-hr*0.8), (0, -hr*0.38, hcz-hr*0.9), "Head")

        for bname, (h, t, p) in bones.items():
            bone = arm_data.edit_bones.new(bname)
            bone.head, bone.tail = h, t
            if p: bone.parent = arm_data.edit_bones[p]
            # Match v6 deforming status
            bone.use_deform = True if bname not in ["Eye.L", "Eye.R", "Ear.L", "Ear.R", "Nose", "Lip.Upper", "Lip.Lower", "Chin"] else False

        bpy.ops.object.mode_set(mode='OBJECT')
        return rig

registry.register_rigging("PlantRigger", PlantRigger)

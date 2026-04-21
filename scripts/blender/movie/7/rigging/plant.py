import bpy
import math
try:
    from rigging.base import Rigger, RigStructure
    from registry import registry
except ImportError:
    from .base import Rigger, RigStructure
    from ..registry import registry

class PlantRigStructure(RigStructure):
    def __init__(self, char_id, th, hr, nh):
        super().__init__(char_id)
        hcz = th + nh + hr
        self.add_bone("Torso", (0,0,0), (0,0,th))
        self.add_bone("Neck", (0,0,th), (0,0,th+nh), parent="Torso")
        self.add_bone("Head", (0,0,th+nh), (0,0,th+nh+hr*2), parent="Neck")
        for side, sx in [("L", 1), ("R", -1)]:
            self.add_bone(f"Arm.{side}", (0.4*sx, 0, th*0.9), (0.4*sx, 0, th*0.9-0.4), parent="Torso")
            self.add_bone(f"Elbow.{side}", (0.4*sx, 0, th*0.9-0.4), (0.4*sx, 0, th*0.9-0.8), parent=f"Arm.{side}")
            self.add_bone(f"Hand.{side}", (0.4*sx, 0, th*0.9-0.8), (0.4*sx, 0, th*0.9-0.95), parent=f"Elbow.{side}")
            self.add_bone(f"Thigh.{side}", (0.25*sx, 0, 0.1), (0.25*sx, 0, -0.4), parent="Torso")
            self.add_bone(f"Knee.{side}", (0.25*sx, 0, -0.4), (0.25*sx, 0, -0.9), parent=f"Thigh.{side}")
            self.add_bone(f"Foot.{side}", (0.25*sx, 0, -0.9), (0.25*sx, -0.15, -0.95), parent=f"Knee.{side}")
            self.add_bone(f"Eye.{side}", (sx*0.14, -hr*0.84, hcz+hr*0.35), (sx*0.14, -hr*0.92, hcz+hr*0.35), parent="Head", use_deform=False)
            self.add_bone(f"Eyelid.Upper.{side}", (sx*0.14, -hr*0.84, hcz+hr*0.4), (sx*0.14, -hr*0.92, hcz+hr*0.4), parent="Head", use_deform=False)
            self.add_bone(f"Eyelid.Lower.{side}", (sx*0.14, -hr*0.84, hcz+hr*0.3), (sx*0.14, -hr*0.92, hcz+hr*0.3), parent="Head", use_deform=False)
            self.add_bone(f"Ear.{side}", (sx*hr*0.9, 0, hcz), (sx*hr*1.1, 0, hcz+0.1), parent="Head", use_deform=False)
        self.add_bone("Nose", (0, -hr*0.97, hcz+hr*0.05), (0, -hr*1.07, hcz+hr*0.05), parent="Head", use_deform=False)
        self.add_bone("Lip.Upper", (0, -hr*0.96, hcz-hr*0.18), (0, -hr*1.06, hcz-hr*0.18), parent="Head", use_deform=False)
        self.add_bone("Lip.Lower", (0, -hr*0.95, hcz-hr*0.24), (0, -hr*1.05, hcz-hr*0.24), parent="Head", use_deform=False)
        self.add_bone("Chin", (0, -hr*0.38, hcz-hr*0.8), (0, -hr*0.38, hcz-hr*0.9), parent="Head", use_deform=False)

class PlantRigger(Rigger):
    def build_rig(self, char_id, params):
        dims = params.get("dimensions", {})
        th, hr, nh = dims.get("torso_h", 1.5), dims.get("head_r", 0.4), dims.get("neck_h", 0.2)
        struct = PlantRigStructure(char_id, th, hr, nh)
        return struct.build()

registry.register_rigging("PlantRigger", PlantRigger)

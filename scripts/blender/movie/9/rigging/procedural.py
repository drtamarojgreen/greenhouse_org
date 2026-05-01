import bpy
import os
import sys

# Ensure Movie 9 root is in sys.path
M9_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M9_ROOT not in sys.path:
    sys.path.insert(0, M9_ROOT)

from base import Rigger, RigStructure
from registry import registry
import base

class ProceduralRigger(base.Rigger):
    """
    Universal Rigger that builds armature from structure data.
    Architecture Kept: The data-driven rigger ensures that the modularity of
    Movie 9 extends to armature construction, enabling custom rig definitions
    without changing Python code.
    """

    def build_rig(self, char_id, params):
        # 1. Use structure from params, decouple from singleton config
        structure = params.get("structure", {})
        rig_data = structure.get("rig", {})

        rig_struct = RigStructure(char_id)
        for b in rig_data.get("bones", []):
            rig_struct.add_bone(
                name=b["name"],
                head=b["head"],
                tail=b["tail"],
                parent=b.get("parent"),
                use_deform=b.get("deform", True)
            )

        rig = rig_struct.build()
        for pb in rig.pose.bones:
            pb.rotation_mode = 'XYZ'

        return rig

registry.register_rigging("ProceduralRigger", ProceduralRigger)

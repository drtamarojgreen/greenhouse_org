import bpy
import os
import sys

# Ensure Movie 7 root is in sys.path
M7_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M7_ROOT not in sys.path:
    sys.path.insert(0, M7_ROOT)

from base import Rigger, RigStructure
from registry import registry
import base

class ProceduralRigger(base.Rigger):
    """Universal Rigger that builds armature from structure data."""

    def build_rig(self, char_id, params):
        structure = params.get("structure", {})
        if not structure:
             import config
             char_cfg = config.config.get_character_config(char_id)
             if char_cfg: structure = char_cfg.get("structure", {})

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

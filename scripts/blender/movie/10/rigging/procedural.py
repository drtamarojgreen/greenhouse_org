try:
    import bpy
    import bmesh
    import mathutils
except ImportError:
    bpy = None
    bmesh = None
    mathutils = None

import os
import sys
import base
from base import Rigger, RigStructure
from registry import registry

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

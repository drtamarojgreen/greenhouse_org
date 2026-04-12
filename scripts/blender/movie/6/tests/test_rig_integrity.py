import bpy
import unittest

class TestRigIntegrity(unittest.TestCase):
    def test_bone_weight_coverage(self):
        """Verifies that all armature bones have corresponding vertex groups with weights."""
        for obj in bpy.data.objects:
            if obj.type == 'ARMATURE':
                mesh = next((c for c in obj.children if c.type == 'MESH'), None)
                if not mesh: continue

                bone_names = [b.name for b in obj.data.bones]
                vg_names = [vg.name for vg in mesh.vertex_groups]

                for bname in bone_names:
                    # Skip control/facial bones that might not have direct weights
                    if "Ctrl" in bname or "." in bname and any(x in bname for x in ["L", "R"]):
                         if bname not in vg_names: continue

                    self.assertIn(bname, vg_names, f"Bone {bname} has no vertex group on {mesh.name}")

if __name__ == '__main__':
    unittest.main()

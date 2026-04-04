import unittest
import bpy
import os
import sys

# Ensure scene 4 modules are in path
SCENE4_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if SCENE4_DIR not in sys.path:
    sys.path.append(SCENE4_DIR)

from generate_scene4 import generate_full_scene_v4
import config

class TestV4Rigging(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Build the full scene once for all tests."""
        generate_full_scene_v4()
        cls.herb = bpy.data.objects.get(config.CHAR_HERBACEOUS)
        cls.arbor = bpy.data.objects.get(config.CHAR_ARBOR)

    def test_rig_existence(self):
        """Verify armatures were created."""
        self.assertIsNotNone(self.herb, "Herbaceous V4 missing")
        self.assertIsNotNone(self.arbor, "Arbor V4 missing")

    def test_new_joints(self):
        """Verify the new joints exist in the rig."""
        for arm in [self.herb, self.arbor]:
            pb = arm.pose.bones
            # Shoulders/Elbows
            self.assertIn("Shoulder.L", pb)
            self.assertIn("Arm.L", pb)
            self.assertIn("Elbow.L", pb)
            # Hips/Knees
            self.assertIn("Hip.L", pb)
            self.assertIn("Thigh.L", pb)
            self.assertIn("Knee.L", pb)

    def test_advanced_facial_bones(self):
        """Verify dual lips and eyelids."""
        for arm in [self.herb, self.arbor]:
            pb = arm.pose.bones
            self.assertIn("Lip.Upper", pb)
            self.assertIn("Lip.Lower", pb)
            self.assertIn("Eyelid.Upper.L", pb)
            self.assertIn("Eyelid.Lower.L", pb)

    def test_mesh_connectivity(self):
        """Verify the mesh is parented to the armature."""
        for arm in [self.herb, self.arbor]:
            body = bpy.data.objects.get(f"{arm.name}_Body")
            self.assertIsNotNone(body, f"Body mesh missing for {arm.name}")
            self.assertEqual(body.parent, arm, f"Body mesh not parented to {arm.name}")

if __name__ == "__main__":
    unittest.main(argv=['first-arg-is-ignored'], exit=False)

import unittest
import bpy
import os
import sys

V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)
ASSETS_V6_DIR = os.path.join(V6_DIR, "assets_v6")
if ASSETS_V6_DIR not in sys.path: sys.path.insert(0, ASSETS_V6_DIR)

import config
import plant_humanoid_v6

class TestFacialAttachment(unittest.TestCase):
    def setUp(self):
        for obj in bpy.data.objects:
            bpy.data.objects.remove(obj, do_unlink=True)

    def test_facial_prop_parenting(self):
        """Verify facial props are correctly parented to bones."""
        name = "TestFacial"
        arm = plant_humanoid_v6.create_plant_humanoid_v6(name, (0,0,0))

        # Identify facial props (usually named with character name and prop type)
        facial_props = [obj for obj in bpy.data.objects if name in obj.name and "Body" not in obj.name]

        self.assertGreater(len(facial_props), 0, "No facial props found")

        for prop in facial_props:
            self.assertEqual(prop.parent, arm, f"Prop {prop.name} not parented to armature")
            self.assertEqual(prop.parent_type, 'BONE', f"Prop {prop.name} not parented to BONE")
            self.assertIsNotNone(prop.parent_bone, f"Prop {prop.name} has no parent bone assigned")
            self.assertIn(prop.parent_bone, arm.data.bones, f"Prop {prop.name} parented to non-existent bone {prop.parent_bone}")

if __name__ == '__main__':
    unittest.main()

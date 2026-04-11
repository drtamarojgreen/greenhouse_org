import unittest
import os
import sys

V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)

import animation_library_v6

class MockBone:
    def __init__(self, name):
        self.name = name

class MockPose:
    def __init__(self, bones):
        self.bones = {b.name: b for b in bones}
    def get(self, name):
        return self.bones.get(name)

class MockArmature:
    def __init__(self, bone_names):
        self.type = 'ARMATURE'
        self.pose = MockPose([MockBone(n) for n in bone_names])

class TestAnimationLibrary(unittest.TestCase):
    def test_get_bone_resolution(self):
        """Verify bone resolution logic for both internal and Mixamo naming."""
        arm = MockArmature(["Torso", "mixamorig:Hips", "Arm.L", "mixamorig:LeftArm"])

        # 1. Test internal naming
        self.assertEqual(animation_library_v6.get_bone(arm, "Torso").name, "Torso")
        self.assertEqual(animation_library_v6.get_bone(arm, "Arm.L").name, "Arm.L")

        # 2. Test mapped name (Tail -> mixamorig:Hips)
        self.assertEqual(animation_library_v6.get_bone(arm, "Tail").name, "mixamorig:Hips")

        # 3. Test automatic prefixing (Hips -> mixamorig:Hips)
        self.assertEqual(animation_library_v6.get_bone(arm, "Hips").name, "mixamorig:Hips")

if __name__ == '__main__':
    unittest.main()

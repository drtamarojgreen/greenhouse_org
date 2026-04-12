import bpy
import unittest

class TestFacialAttachment(unittest.TestCase):
    def test_bone_parent_origin(self):
        """Verifies facial props are parented to bones and not stuck at origin."""
        facial_keywords = ["Eye", "Nose", "Lip", "Pupil"]

        for obj in bpy.data.objects:
            if any(k in obj.name for k in facial_keywords) and obj.type == 'MESH':
                self.assertIsNotNone(obj.parent, f"Facial prop {obj.name} has no parent")
                self.assertEqual(obj.parent_type, 'BONE', f"Facial prop {obj.name} not parented to BONE")

                # Verify not at world origin (common failure mode)
                self.assertNotEqual(obj.matrix_world.translation.length, 0.0, f"Facial prop {obj.name} stuck at origin")

if __name__ == '__main__':
    unittest.main()

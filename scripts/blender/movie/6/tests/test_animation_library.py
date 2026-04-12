import bpy
import unittest

class TestAnimationLibrary(unittest.TestCase):
    def test_keyframe_insertion(self):
        """Verifies that animations result in keyframes on the objects."""
        for obj in bpy.data.objects:
            if obj.type == 'ARMATURE' or (obj.type == 'MESH' and obj.parent and obj.parent.type == 'ARMATURE'):
                if obj.animation_data and obj.animation_data.action:
                    self.assertGreater(len(obj.animation_data.action.fcurves), 0, f"Object {obj.name} has action but no fcurves")

if __name__ == '__main__':
    unittest.main()

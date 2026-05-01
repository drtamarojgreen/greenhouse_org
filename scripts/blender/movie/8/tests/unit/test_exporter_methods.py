# test_exporter_methods.py - Granular unit tests for Movie 8 Exporter utilities

import bpy
import unittest
import mathutils
import os
import sys

# Add Movie 8 root to sys.path
M8_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if M8_ROOT not in sys.path:
    sys.path.insert(0, M8_ROOT)

from asset_exporter import UnityAssetExporter

class TestExporterUtilities(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.exporter = UnityAssetExporter()

    def test_vector_to_list(self):
        v = mathutils.Vector((1.0, 2.5, -3.0))
        result = self.exporter._vector_to_list(v)
        self.assertEqual(result, [1.0, 2.5, -3.0])

    def test_euler_to_list(self):
        e = mathutils.Euler((0.0, 1.57, 3.14))
        result = self.exporter._euler_to_list(e)
        self.assertEqual(result, [0.0, 1.57, 3.14])

    def test_classify_animation(self):
        cases = {
            "Idle_Loop": "idle",
            "Hero_Walk_Fast": "walk",
            "Sprint_Action": "run",
            "Jump_Up": "jump",
            "Attack_Sword": "attack",
            "Dance_Joy": "emote",
            "NPC_Talk": "dialogue",
            "Random_Move": "action"
        }
        for name, expected in cases.items():
            self.assertEqual(self.exporter._classify_animation(name), expected)

    def test_get_character_bounds_empty(self):
        """Test bounds with a rig that has no meshes."""
        bpy.ops.object.armature_add()
        rig = bpy.context.active_object

        min_v, max_v = self.exporter._get_character_bounds(rig)
        self.assertEqual(list(min_v), [0, 0, 0])
        self.assertEqual(list(max_v), [1, 1, 1])

    def test_get_character_bounds_simple(self):
        """Test bounds calculation for a simple cube mesh child."""
        bpy.ops.object.armature_add()
        rig = bpy.context.active_object

        bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 1))
        mesh = bpy.context.active_object
        mesh.parent = rig

        min_v, max_v = self.exporter._get_character_bounds(rig)

        # Cube size 2 centered at (0,0,1) -> min (-1,-1,0), max (1,1,2)
        self.assertAlmostEqual(min_v.x, -1.0)
        self.assertAlmostEqual(max_v.z, 2.0)

if __name__ == "__main__":
    unittest.main(argv=['first-arg-is-ignored'], exit=False)

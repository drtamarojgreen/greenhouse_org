import unittest
import bpy
import os
import sys
import mathutils

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
M9_ROOT = os.path.dirname(TEST_DIR)
if M9_ROOT not in sys.path:
    sys.path.insert(0, M9_ROOT)

import config
from render import build_scene


class TestSceneVisibilityAndRigging(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        build_scene()

    def test_calligraphy_visibility_windows(self):
        obj = bpy.data.objects.get("GreenhouseMD_Calligraphy")
        self.assertIsNotNone(obj, "GreenhouseMD calligraphy text object is missing.")

        scene = bpy.context.scene
        scene.frame_set(1)
        self.assertFalse(obj.hide_render, "Calligraphy should be visible at frame 1.")
        scene.frame_set(6)
        self.assertTrue(obj.hide_render, "Calligraphy should be hidden after intro window.")
        scene.frame_set(config.config.total_frames - 4)
        self.assertFalse(obj.hide_render, "Calligraphy should be visible at start of outro window.")

    def test_calligraphy_location_near_intro_camera(self):
        obj = bpy.data.objects.get("GreenhouseMD_Calligraphy")
        cam = bpy.data.objects.get("Exterior")
        self.assertIsNotNone(obj, "GreenhouseMD calligraphy text object is missing.")
        self.assertIsNotNone(cam, "Exterior camera missing.")

        bpy.context.scene.frame_set(1)
        dist = (obj.matrix_world.translation - cam.matrix_world.translation).length
        self.assertGreater(dist, 1.0)
        self.assertLess(dist, 10.0)

    def test_character_rigs_and_grounding(self):
        for entity in config.config.get("ensemble.entities", []):
            char_id = entity["id"]
            expects_rig = (entity.get("type") != "DYNAMIC" and entity.get("source_rig")) or (
                entity.get("type") == "DYNAMIC" and entity.get("components", {}).get("rigging")
            )

            rig = bpy.data.objects.get(f"{char_id}.Rig")
            if expects_rig:
                self.assertIsNotNone(rig, f"{char_id} rig missing")
                self.assertGreaterEqual(rig.location.z, -20.0, f"{char_id} has extreme below-ground placement")

            mesh = bpy.data.objects.get(f"{char_id}.Body")
            if rig and mesh:
                has_bound_modifier = any(m.type == 'ARMATURE' and m.object == rig for m in mesh.modifiers)
                self.assertTrue(mesh.parent == rig or has_bound_modifier, f"{char_id} mesh is not rig-bound")


if __name__ == "__main__":
    unittest.main()

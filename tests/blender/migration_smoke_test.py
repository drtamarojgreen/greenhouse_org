import sys
import os
import unittest
from unittest.mock import MagicMock

# Add the directory of the script to the Python path
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(script_dir))
sys.path.append(os.path.join(project_root, "scripts/blender/movie"))

# Mock bpy and other blender-specific imports
sys.modules['bpy'] = MagicMock()
sys.modules['mathutils'] = MagicMock()
sys.modules['bpy_extras'] = MagicMock()
sys.modules['bmesh'] = MagicMock()

import master
import render_profiles
import camera_controls

class TestMigration(unittest.TestCase):
    def test_render_profiles_application(self):
        """Verify that render profiles can be applied to a scene."""
        scene = MagicMock()
        profile = render_profiles.apply_render_profile(scene, "test")
        self.assertEqual(profile["engine"], "BLENDER_EEVEE_NEXT")
        self.assertEqual(scene.render.engine, "BLENDER_EEVEE_NEXT")

    def test_visibility_scale_culling(self):
        """Verify that _set_visibility includes scale-culling keyframes."""
        master_instance = master.BaseMaster()
        obj = MagicMock()
        obj.animation_data = MagicMock()
        obj.animation_data.action = MagicMock()
        obj.location.z = 0
        obj.scale = MagicMock()
        obj.children = []

        master_instance._set_visibility([obj], [(100, 200)])

        # Check if keyframe_insert was called for scale
        scale_calls = [call for call in obj.keyframe_insert.call_args_list if "scale" in call[1].get("data_path", "")]
        self.assertTrue(len(scale_calls) > 0, "Scale keyframes should be inserted for visibility.")

    def test_rail_camera_creation(self):
        """Verify that setup_rail_camera creates camera and target objects."""
        master_instance = master.BaseMaster()
        import bpy
        bpy.data.cameras.new.return_value = MagicMock()
        bpy.data.objects.new.side_effect = [MagicMock(name="RailCam"), MagicMock(name="RailTarget")]

        cam, target = camera_controls.setup_rail_camera(master_instance)
        self.assertIsNotNone(cam)
        self.assertIsNotNone(target)
        self.assertTrue(cam.constraints.new.called)

if __name__ == '__main__':
    unittest.main()

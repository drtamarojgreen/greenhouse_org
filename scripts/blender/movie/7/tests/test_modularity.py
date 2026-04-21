import unittest
import bpy
import os
import sys

# Ensure Movie 7 is in path
M7_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M7_DIR not in sys.path:
    sys.path.append(M7_DIR)

from config import config
from asset_manager import AssetManager
from director import Director

class TestMovie7Modularity(unittest.TestCase):

    def setUp(self):
        self.manager = AssetManager()
        self.director = Director()
        self.manager.clear_scene()

    def test_config_loading(self):
        """Verifies that the configuration loads correctly."""
        self.assertEqual(config.total_frames, 4200)
        self.assertEqual(config.coll_assets, "7a.ASSETS")

    def test_collection_creation(self):
        """Verifies that the manager creates collections as expected."""
        coll = self.manager.ensure_collection("TestColl")
        self.assertIn("TestColl", bpy.data.collections)
        self.assertIn(coll.name, bpy.context.scene.collection.children)

    def test_director_camera_setup(self):
        """Verifies that the director sets up cameras from config."""
        self.director.setup_cameras()
        active_cam_id = config.get("cinematics.active_camera")
        self.assertIn(active_cam_id, bpy.data.objects)
        self.assertEqual(bpy.context.scene.camera.name, active_cam_id)

    def test_environment_setup(self):
        """Verifies backdrop creation."""
        self.director.setup_environment()
        backdrops = config.get("environment.backdrops", [])
        for bd in backdrops:
            self.assertIn(f"Backdrop_{bd['id']}", bpy.data.objects)

    def test_blender_5_1_compatibility_slots(self):
        """Checks for action_slot presence which is a 5.1+ feature."""
        # This is a soft check to see if the environment is indeed 5.1+
        # or if our compatibility shim is working.
        obj = bpy.data.objects.new("TestObj", None)
        bpy.context.scene.collection.objects.link(obj)
        obj.animation_data_create()
        # If it's 5.1, it should have action_slot or we should have shimmied it
        self.assertTrue(hasattr(obj.animation_data, "action_slot") or hasattr(bpy.types.AnimData, "action_slot"))

if __name__ == "__main__":
    unittest.main()

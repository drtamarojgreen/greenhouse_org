import bpy
import unittest
import os
import sys

# Add movie root to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from sequel_generator import SequelMaster
    from constants import SCENE_MAP
    SEQUEL_AVAILABLE = True
except ImportError:
    SEQUEL_AVAILABLE = False

import style_utilities as style

@unittest.skipUnless(SEQUEL_AVAILABLE, "sequel_generator not available")
class TestSequelGenerator(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Point 55: Test for SequelMaster
        cls.master = SequelMaster(mode='SILENT_FILM')
        cls.master.run()

    def test_sequel_frame_range(self):
        """Verify sequel has the correct 6000 frame range."""
        self.assertEqual(self.master.scene.frame_end, 6000)

    def test_sequel_assets(self):
        """Verify assets specific to the sequel are loaded."""
        required = ["Herbaceous_Torso", "Arbor_Torso", "GloomGnome_Torso", "StoicAnvil"]
        for name in required:
            self.assertIn(name, bpy.data.objects, f"Sequel asset {name} missing")

    def test_duel_scene_presence(self):
        """Verify the duel scene animation exists."""
        gnome = self.master.gnome
        self.assertIsNotNone(gnome.animation_data)
        # Check for keyframes in duel range (4501+)
        found = False
        for fc in style.get_action_curves(gnome.animation_data.action):
            for kp in fc.keyframe_points:
                if kp.co[0] >= 4501:
                    found = True
                    break
        self.assertTrue(found, "No duel animation found in sequel")

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)

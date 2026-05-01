import unittest
import os
import sys
import json
from pathlib import Path

# Mock bpy and mathutils if they don't exist (for non-Blender environments)
try:
    import bpy
    import mathutils
except ImportError:
    bpy = None
    mathutils = None

# Ensure Movie 8 and Movie 7 root are in sys.path
M8_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
M7_ROOT = os.path.join(os.path.dirname(M8_ROOT), "7")

if M8_ROOT not in sys.path:
    sys.path.insert(0, M8_ROOT)
if M7_ROOT not in sys.path:
    sys.path.insert(0, M7_ROOT)

from asset_exporter import UnityAssetExporter

class TestMovie8Exporter(unittest.TestCase):
    def setUp(self):
        self.export_dir = Path(M8_ROOT) / "test_export_output"
        self.exporter = UnityAssetExporter(export_root=str(self.export_dir))

    def test_classification_logic(self):
        """Verifies that the exporter correctly classifies animations for Unity."""
        self.assertEqual(self.exporter._classify_animation("Hero_Idle_01"), "idle")
        self.assertEqual(self.exporter._classify_animation("WalkCycle"), "walk")
        self.assertEqual(self.exporter._classify_animation("Arbor_Talk_Angry"), "dialogue")
        self.assertEqual(self.exporter._classify_animation("Victory_Dance"), "emote")
        self.assertEqual(self.exporter._classify_animation("Generic_Action"), "action")

    def test_vector_conversion(self):
        """Verifies vector to list conversion for JSON export."""
        if mathutils:
            vec = mathutils.Vector((1.0, 2.5, -3.0))
            lst = self.exporter._vector_to_list(vec)
            self.assertEqual(lst, [1.0, 2.5, -3.0])

    def test_export_directory_creation(self):
        """Verifies that the exporter creates the necessary directory structure."""
        self.assertTrue(self.export_dir.exists())
        # The constructor creates the root, but methods create subdirs
        self.exporter.export_characters()
        self.assertTrue((self.export_dir / "Characters").exists())

if __name__ == "__main__":
    unittest.main()

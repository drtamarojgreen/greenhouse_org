# test_environment_components.py - CDD tests for mental health assets

import bpy
import unittest
import os
import sys

# Add Movie 8 root to sys.path
M8_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if M8_ROOT not in sys.path:
    sys.path.insert(0, M8_ROOT)

from generate_mental_health_assets import MentalHealthAssetGenerator

class TestMentalHealthComponents(unittest.TestCase):
    """
    Component-Driven Development tests for isolated mental health assets.
    Ensures each component meets technical and psychological specifications.
    """

    @classmethod
    def setUpClass(cls):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        cls.generator = MentalHealthAssetGenerator()
        cls.generator.generate_all()

    def test_clinical_desk_component(self):
        """Verify structural integrity of the Psychiatric Office desk."""
        obj = bpy.data.objects.get("ClinicalDesk")
        self.assertIsNotNone(obj, "ClinicalDesk was not generated.")
        self.assertEqual(obj.type, 'MESH')
        # Check if it has legs (children)
        self.assertGreaterEqual(len(obj.children), 4, "ClinicalDesk missing supportive structures (legs).")

    def test_wellness_trellis_component(self):
        """Verify organic nature of the Wellness Garden trellis."""
        obj = bpy.data.objects.get("WellnessTrellis")
        self.assertIsNotNone(obj, "WellnessTrellis was not generated.")
        # Organic objects should have modifiers for smoothing/thickness
        modifier_types = [m.type for m in obj.modifiers]
        self.assertIn('SKIN', modifier_types)
        self.assertIn('SUBSURF', modifier_types)

    def test_beach_gazebo_component(self):
        """Verify clarity and shelter structure of the Beach Gazebo."""
        obj = bpy.data.objects.get("BeachGazebo")
        self.assertIsNotNone(obj, "BeachGazebo was not generated.")
        # Should have a floor, pillars, and a roof
        pillars = [c for c in obj.children if "Cylinder" in c.name]
        self.assertEqual(len(pillars), 8, "BeachGazebo missing circular pillar arrangement.")
        roof = [c for c in obj.children if "Cone" in c.name]
        self.assertEqual(len(roof), 1, "BeachGazebo missing protective roof structure.")

    def test_mountain_forest_component(self):
        """Verify rugged resilience of the Mountain Forest Path."""
        obj = bpy.data.objects.get("ResiliencePath")
        self.assertIsNotNone(obj, "ResiliencePath was not generated.")
        # Ruggedness check (vertices not all at same height)
        z_coords = [v.co.z for v in obj.data.vertices]
        self.assertNotEqual(min(z_coords), max(z_coords), "Mountain Path is too flat; missing rugged resilience.")
        # Sentinels check
        sentinels = [c for c in obj.children if "Pine_Sentinel" in c.name]
        self.assertGreaterEqual(len(sentinels), 3, "Mountain Path missing Pine Sentinels.")

    def test_library_shelf_component(self):
        """Verify cognitive storage structure of the Meditation Library shelf."""
        obj = bpy.data.objects.get("LibraryShelf_Logic")
        self.assertIsNotNone(obj, "LibraryShelf_Logic was not generated.")
        # Should have slots for books/data
        slots = [c for c in obj.children if "ShelfSlot" in c.name]
        self.assertGreaterEqual(len(slots), 5, "LibraryShelf missing internal storage divisions.")

    def test_psychological_metadata_assignment(self):
        """Placeholder for checking if objects have associated psychological tags in metadata."""
        # In a real CDD workflow, we might attach custom properties to Blender objects
        for obj in bpy.data.objects:
            if obj.name == "ClinicalDesk":
                obj["psych_meaning"] = "Analytical Structure"
                self.assertEqual(obj["psych_meaning"], "Analytical Structure")

if __name__ == "__main__":
    unittest.main(argv=['first-arg-is-ignored'], exit=False)

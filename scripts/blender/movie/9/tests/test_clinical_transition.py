import unittest
import bpy
import os
import sys
import mathutils

# Ensure Movie 9 root is in sys.path
M9_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M9_ROOT not in sys.path:
    sys.path.insert(0, M9_ROOT)

import config
from director import Director
from asset_manager import AssetManager
from character_builder import CharacterBuilder
import components

class TestClinicalTransitionV9(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        components.initialize_registry()
        cls.manager = AssetManager()
        cls.manager.clear_scene()

        # Build necessary entities for testing
        for eid in ["Herbaceous", "Arbor", "ClinicalDesk", "PatientChair"]:
            ent = config.config.get_character_config(eid)
            if ent:
                char = CharacterBuilder.create(eid, ent)
                char.build(cls.manager)
                char.apply_pose()

        cls.director = Director()
        cls.director.setup_cinematics()
        cls.director.apply_scene_animations()
        cls.director.apply_storyline()
        cls.director.apply_sequencing()

    def test_clinical_beat_timing(self):
        """Verifies 'Clinical Exchange' beat configuration."""
        storyline = config.config.get("ensemble.storyline", [])
        clinical_beat = next((b for b in storyline if b["beat"] == "Clinical Exchange"), None)
        self.assertIsNotNone(clinical_beat)
        self.assertEqual(clinical_beat["start"], 1000)
        self.assertEqual(clinical_beat["end"], 1800)

    def test_character_navigation_to_clinical(self):
        """Verifies protagonists reach clinical coordinates by frame 1100."""
        # Check positions at frame 1100 (after move_to duration)
        bpy.context.scene.frame_set(1100)

        herb = bpy.data.objects.get("Herbaceous.Rig")
        arbor = bpy.data.objects.get("Arbor.Rig")

        # Herbaceous destination: [-1.5, -3.2, 0]
        # Arbor destination: [-4.0, -3.0, 0]
        if herb:
            self.assertAlmostEqual(herb.location.x, -1.5, places=1)
            self.assertAlmostEqual(herb.location.y, -3.2, places=1)
        if arbor:
            self.assertAlmostEqual(arbor.location.x, -4.0, places=1)
            self.assertAlmostEqual(arbor.location.y, -3.0, places=1)

    def test_swap_logic_coordinates(self):
        """Verifies character positions after the clinical swap at frame 1540."""
        bpy.context.scene.frame_set(1540)

        herb = bpy.data.objects.get("Herbaceous.Rig")
        arbor = bpy.data.objects.get("Arbor.Rig")

        # Swap: Herbaceous -> Desk [-4.0, -3.0], Arbor -> Chair [-1.5, -3.2]
        if herb:
            self.assertAlmostEqual(herb.location.x, -4.0, places=1)
        if arbor:
            self.assertAlmostEqual(arbor.location.x, -1.5, places=1)

if __name__ == "__main__":
    unittest.main()

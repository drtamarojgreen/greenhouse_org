import json
import math
import os
import sys
import unittest

try:
    import bpy
    import bmesh
    import mathutils
except ImportError:
    bpy = None
    bmesh = None
    mathutils = None

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
M10_ROOT = os.path.abspath(os.path.join(TEST_DIR, "..", ".."))
M9_ROOT = os.path.abspath(os.path.join(M10_ROOT, "..", "9"))

if M10_ROOT not in sys.path:
    sys.path.insert(0, M10_ROOT)
if M9_ROOT not in sys.path:
    sys.path.append(M9_ROOT)

import movie_configuration as mc
from asset_manager import AssetManager
from director import Director
from render import build_scene
from animation_handler import AnimationHandler
from character_builder import CharacterBuilder
from modeling.greenhouse_mobile import GreenhouseMobileModeler
import components

class TestClinicalTransitionV10(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        components.initialize_registry()
        cls.manager = AssetManager()
        cls.manager.clear_scene()

        # Build necessary entities for testing
        for eid in ["Herbaceous_HF", "Arbor_HF", "ClinicalDesk", "PatientChair"]:
            ent = mc.get_character_config(eid)
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
        storyline = mc.get("ensemble.storyline", [])
        clinical_beat = next((b for b in storyline if b["beat"] == "Clinical Exchange"), None)
        self.assertIsNotNone(clinical_beat)
        self.assertEqual(clinical_beat["start"], 1000)
        self.assertEqual(clinical_beat["end"], 1800)

    def test_character_navigation_to_clinical(self):
        """Verifies protagonists reach clinical coordinates by frame 1100."""
        # Check positions at frame 1100 (after move_to duration)
        bpy.context.scene.frame_set(1100)

        herb = bpy.data.objects.get("Herbaceous_HF.Rig")
        arbor = bpy.data.objects.get("Arbor_HF.Rig")

        # Herbaceous_HF destination: [-1.5, -3.2, 0]
        # Arbor_HF destination: [-4.0, -3.0, 0]
        if herb:
            self.assertAlmostEqual(herb.location.x, -1.5, places=1)
            self.assertAlmostEqual(herb.location.y, -3.2, places=1)
        if arbor:
            self.assertAlmostEqual(arbor.location.x, -4.0, places=1)
            self.assertAlmostEqual(arbor.location.y, -3.0, places=1)

    def test_swap_logic_coordinates(self):
        """Verifies character positions after the clinical swap at frame 1540."""
        bpy.context.scene.frame_set(1540)

        herb = bpy.data.objects.get("Herbaceous_HF.Rig")
        arbor = bpy.data.objects.get("Arbor_HF.Rig")

        # Swap: Herbaceous_HF -> Desk [-4.0, -3.0], Arbor_HF -> Chair [-1.5, -3.2]
        if herb:
            self.assertAlmostEqual(herb.location.x, -4.0, places=1)
        if arbor:
            self.assertAlmostEqual(arbor.location.x, -1.5, places=1)

if __name__ == "__main__":
    unittest.main()

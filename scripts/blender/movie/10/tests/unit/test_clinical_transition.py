import unittest
try: import bpy
except ImportError: bpy = None
import os
import sys
try: import mathutils
except ImportError: mathutils = None

# Ensure Movie 10 root is in sys.path
M10_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if M10_ROOT not in sys.path:
    sys.path.insert(0, M10_ROOT)
try:
    import movie_configuration as mc
except ImportError:
    from . import movie_configuration as mc

try:
    try:
    from director import
except ImportError:
    from ..director import Director
except ImportError:
    from .director import Director
try:
    try:
    from asset_manager import
except ImportError:
    from ..asset_manager import AssetManager
except ImportError:
    from .asset_manager import AssetManager
try:
    try:
    from character_builder import
except ImportError:
    from ..character_builder import CharacterBuilder
except ImportError:
    from .character_builder import CharacterBuilder
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

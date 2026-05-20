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

class TestMovie10FacialVisibility(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manager = AssetManager()
        cls.manager.clear_scene()

    def test_protagonist_facial_features(self):
        """Verifies that protagonists have pupils and irises present in the rig hierarchy."""
        # Test with Herbaceous_HF as representative
        entity = {
            "id": "Herbaceous_HF",
            "type": "MESH",
            "is_protagonist": True,
            "components": {
                "modeling": "PlantModeler",
                "rigging": "PlantRigger",
                "shading": "UniversalShader"
            }
        }
        char = CharacterBuilder.create("Herbaceous_HF", entity)
        char.build(self.manager)

        rig = bpy.data.objects.get("Herbaceous_HF.Rig")
        self.assertIsNotNone(rig, "Rig not created")

        # Check for facial feature markers or meshes
        children_names = [c.name for c in rig.children_recursive]

        # In Movie 10, facial features might be sub-meshes or vertex groups.
        # If they are separate objects parented to the head bone:
        facial_parts = [n for n in children_names if any(x in n.lower() for x in ["pupil", "iris", "eye"])]

        # If the modeler creates them as part of the body mesh, check materials
        body = bpy.data.objects.get("Herbaceous_HF.Body")
        if body:
            mat_names = [m.name.lower() for m in body.data.materials if m]
            self.assertTrue(any("eye" in m or "iris" in m or "pupil" in m for m in mat_names),
                            f"Missing facial materials on body. Found: {mat_names}")
        else:
            self.assertGreater(len(facial_parts), 0, "No facial parts (pupils/eyes) found in hierarchy")

if __name__ == "__main__":
    unittest.main()

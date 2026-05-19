import unittest
try: import bpy
except ImportError: bpy = None
import os
import sys

# Add script directory to path
M10_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if M10_ROOT not in sys.path:
    sys.path.append(M10_ROOT)
try:
    import movie_configuration as mc
except ImportError:
    from . import movie_configuration as mc

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

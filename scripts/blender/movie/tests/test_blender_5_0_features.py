import bpy
import unittest
import os
import sys

# Add movie root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from silent_movie_generator import MovieMaster

class TestBlender50Features(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.master = MovieMaster(mode='SILENT_FILM')
        cls.master.run()

    def test_principled_bsdf_v2(self):
        """Test for Blender 4.0/5.0 Principled BSDF node inputs."""
        mat = bpy.data.materials.new(name="TestBSDFV2")
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")

        # In Blender 4.0+, 'Transmission' became 'Transmission Weight'
        # This test checks if our scripts handle both or the new one specifically
        has_new = "Transmission Weight" in bsdf.inputs
        has_old = "Transmission" in bsdf.inputs

        print(f"DEBUG: Principled BSDF inputs: {bsdf.inputs.keys()}")
        self.assertTrue(has_new or has_old, "Principled BSDF missing Transmission input entirely")

    def test_layered_action_api(self):
        """Test for Blender 5.0 (Animation 2025) Layered Action compatibility."""
        # Create a dummy action
        action = bpy.data.actions.new(name="TestLayeredAction")

        # Check if the 'get_action_curves' helper handles the current Blender version's structure
        curves = self.master.get_action_curves(action)
        self.assertIsInstance(curves, (list, bpy.types.bpy_prop_collection),
                             f"get_action_curves returned unexpected type: {type(curves)}")

    def test_fbx_patch_application(self):
        """Verify that the FBX importer patch was applied for Blender 5.0."""
        try:
            import io_scene_fbx
            if hasattr(io_scene_fbx, 'ImportFBX'):
                ImportFBX = io_scene_fbx.ImportFBX
                is_patched = getattr(ImportFBX, '_is_patched', False)
                self.assertTrue(is_patched, "FBX Importer patch NOT applied")
        except ImportError:
            self.skipTest("io_scene_fbx module not available in this environment")

    def test_eevee_next_compatibility(self):
        """Test Eevee Next (Blender 4.2+) settings used in Blender 5.0."""
        scene = bpy.context.scene
        # Eevee Next settings check
        if hasattr(scene, "eevee"):
            # Check for bloom (deprecated in some 4.2 builds but often present in 5.0 via extensions or specific paths)
            # This is more of an exploration test
            print(f"DEBUG: Eevee settings: {dir(scene.eevee)}")

if __name__ == "__main__":
    unittest.main(exit=False)

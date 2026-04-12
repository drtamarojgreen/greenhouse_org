import bpy
import unittest

class TestEnsembleIntegrity(unittest.TestCase):
    def test_collection_and_materials(self):
        """Verifies ensemble collection presence and material population."""
        coll = bpy.data.collections.get("6a.ASSETS")
        self.assertIsNotNone(coll, "Ensemble collection 6a.ASSETS missing")

        for obj in coll.objects:
            if obj.type == 'MESH':
                self.assertGreater(len(obj.data.materials), 0, f"Mesh {obj.name} has no materials")

if __name__ == '__main__':
    unittest.main()

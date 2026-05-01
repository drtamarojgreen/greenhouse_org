import unittest
import bpy
import os
import sys

# Add script directory to path
M9_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M9_ROOT not in sys.path:
    sys.path.append(M9_ROOT)

from asset_manager import AssetManager
from character_builder import CharacterBuilder

class TestMovie9Wheels(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manager = AssetManager()
        cls.manager.clear_scene()

    def test_greenhouse_mobile_wheels(self):
        """Verifies that the GreenhouseMobile has 4 grounded wheels."""
        entity = {
            "id": "TestMobile",
            "type": "DYNAMIC",
            "components": { "modeling": "GreenhouseMobileModeler" }
        }
        char = CharacterBuilder.create("TestMobile", entity)
        char.build(self.manager)
        
        obj = bpy.data.objects.get("TestMobile")
        self.assertIsNotNone(obj, "Mobile object not created")
        bpy.context.view_layer.update()
        
        wheels = [c for c in obj.children_recursive if "Wheel" in c.name and c.type == 'MESH']
        self.assertEqual(len(wheels), 4, f"Expected 4 wheels, found {len(wheels)}")
        
        for wheel in wheels:
            # Check grounding (Z should be near 0 at the bottom)
            import mathutils
            bbox = [wheel.matrix_world @ mathutils.Vector(corner) for corner in wheel.bound_box]
            min_z = min(v.z for v in bbox)
            self.assertAlmostEqual(min_z, 0.0, delta=0.1, msg=f"Wheel {wheel.name} grounded (Z={min_z})")

if __name__ == "__main__":
    unittest.main()

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

class TestMovie10Wheels(unittest.TestCase):
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
            try: import mathutils
except ImportError: mathutils = None
            bbox = [wheel.matrix_world @ mathutils.Vector(corner) for corner in wheel.bound_box]
            min_z = min(v.z for v in bbox)
            self.assertAlmostEqual(min_z, 0.0, delta=0.1, msg=f"Wheel {wheel.name} grounded (Z={min_z})")

if __name__ == "__main__":
    unittest.main()

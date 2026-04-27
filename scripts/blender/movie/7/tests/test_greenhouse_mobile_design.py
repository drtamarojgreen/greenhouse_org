import unittest
import bpy
import bmesh
import os
import sys

# Add script directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from modeling.greenhouse_mobile import GreenhouseMobileModeler
from asset_manager import AssetManager

class TestGreenhouseMobileDesign(unittest.TestCase):
    def setUp(self):
        self.manager = AssetManager()
        self.manager.clear_scene()

    def test_el_camino_structure(self):
        """Verifies the El Camino (coupe utility) structure of the Greenhouse Mobile."""
        modeler = GreenhouseMobileModeler()
        params = {
            "body_length": 4.0,
            "body_width": 2.8,
            "body_height": 2.0
        }
        obj = modeler.build_mesh("TestMobile", params)
        
        self.assertIsNotNone(obj)
        self.assertEqual(obj.name, "TestMobile")
        
        # Check for materials (Body, Glass, Chrome, Tire)
        mat_names = [m.name for m in obj.data.materials if m]
        self.assertIn("mat_gm_body", mat_names)
        self.assertIn("mat_gm_glass", mat_names)
        self.assertIn("mat_gm_chrome", mat_names)
        
        # Check for children (Wheels and Bed Plants)
        children = obj.children
        wheels = [c for c in children if "Wheel" in c.name]
        plants = [c for c in children if "BedPlant" in c.name]
        
        self.assertEqual(len(wheels), 4, "Should have 4 wheels")
        self.assertGreaterEqual(len(plants), 5, "Should have plants in the greenhouse bed")
        
        # Check wheels for chrome rims
        for wheel in wheels:
            wheel_mats = [m.name for m in wheel.data.materials if m]
            self.assertIn("mat_gm_chrome", wheel_mats)
            self.assertIn("mat_gm_tire", wheel_mats)

    def test_automotive_details(self):
        """Verifies presence of mirrors and sunroof in the mesh geometry."""
        modeler = GreenhouseMobileModeler()
        obj = modeler.build_mesh("DetailMobile", {})
        
        # Check for sunroof (glass faces at the top of the cabin)
        bm = bmesh.new()
        bm.from_mesh(obj.data)
        
        sunroof_faces = [f for f in bm.faces if f.material_index == 1 and f.normal.z > 0.9]
        self.assertGreater(len(sunroof_faces), 0, "No sunroof faces found on top of cabin")
        
        # Check for mirrors (extrusions or parts on the sides at cabin height)
        # Threshold lowered to 1.2 for the new El Camino cabin width
        mirror_verts = [v for v in bm.verts if abs(v.co.y) > 1.2 and v.co.z > 0.8]
        self.assertGreater(len(mirror_verts), 0, f"No mirror geometry found on the sides (max Y: {max(abs(v.co.y) for v in bm.verts):.2f})")
        
        bm.free()

if __name__ == "__main__":
    unittest.main()

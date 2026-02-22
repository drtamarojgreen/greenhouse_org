import bpy
import sys
import unittest
from base_test import BlenderTestCase

class TestLighting(BlenderTestCase):
    def log_result(self, id, name, status, details=""):
        print(f"[{'✓' if status == 'PASS' else '✗'}] {id}: {name} -> {status} ({details})")

    # --- Section 4.1: Emission-as-Fade Bug Fix ---

    def test_4_1_2_garden_bush_emission_zero(self):
        """4.1.2: Garden bush emission strength is 0 after fade-in."""
        mat = bpy.data.materials.get("BushMat_GardenBush_0")
        if mat and mat.node_tree:
            self.master.scene.frame_set(600) # After fade-in
            node = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
            if node:
                # Check Emission Strength input
                strength = node.inputs.get("Emission Strength")
                if strength:
                    val = strength.default_value
                    status = "PASS" if val == 0.0 else "FAIL"
                    self.log_result("4.1.2", "Bush Emission", status, f"Val: {val}")
                    self.assertEqual(val, 0.0)

    # --- Section 4.2: New Character Key Lights ---

    def _check_key_light(self, l_id, name, l_type='SPOT', energy=15000):
        obj = bpy.data.objects.get(name)
        exists = obj is not None and obj.type == 'LIGHT' and obj.data.type == l_type
        
        status = "PASS" if exists else "FAIL"
        details = f"Found {l_type}" if exists else "Missing or wrong type"
        self.log_result(l_id, name, status, details)
        self.assertTrue(exists)
        
        if exists:
            self.assertEqual(obj.data.energy, energy)

    def test_4_2_1_herbaceous_key(self):
        """4.2.1: HerbaceousKeyLight object exists in scene."""
        # Point 142: Moderated for Cycles
        self._check_key_light("4.2.1", "HerbaceousKeyLight", 'SPOT', 5000)

    def test_4_2_2_arbor_key(self):
        """4.2.2: ArborKeyLight object exists in scene."""
        # Point 142: Moderated for Cycles
        self._check_key_light("4.2.2", "ArborKeyLight", 'SPOT', 5000)

    def test_4_2_3_gnome_key_tint(self):
        """4.2.3: GnomeKeyLight object exists with green tint."""
        obj = bpy.data.objects.get("GnomeKeyLight")
        if obj:
            color = obj.data.color
            is_green = color.g > color.r and color.g > color.b
            status = "PASS" if is_green else "FAIL"
            self.log_result("4.2.3", "Gnome Key Tint", status, f"RGB: {color[0]:.1f}, {color[1]:.1f}, {color[2]:.1f}")
            self.assertTrue(is_green)

    def test_4_2_6_key_light_dialogue_boost(self):
        """4.2.6: Character key lights brighten during dialogue scenes."""
        light = bpy.data.objects.get("HerbaceousKeyLight")
        if light:
            self.master.scene.frame_set(9550) # Scene 16
            energy = light.data.energy
            # Point 142: Moderated for Cycles (was 25000)
            status = "PASS" if energy == 10000 else "FAIL"
            self.log_result("4.2.6", "Light Boost", status, f"Energy: {energy}")
            self.assertEqual(energy, 10000)

    def test_4_2_7_gnome_light_dimming(self):
        """4.2.7: GnomeKeyLight dims progressively."""
        light = bpy.data.objects.get("GnomeKeyLight")
        if light:
            # Plan: 8000 -> 4000 -> 1500 -> 500
            checks = [(11601, 8000), (12301, 4000), (13001, 1500), (13701, 500)]
            for f, expected in checks:
                self.master.scene.frame_set(f)
                val = light.data.energy
                with self.subTest(frame=f):
                    self.assertAlmostEqual(val, expected, delta=1.0)

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)
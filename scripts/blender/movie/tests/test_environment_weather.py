import bpy
import unittest
import os
import sys
from base_test import BlenderTestCase

class TestEnvironmentWeather(BlenderTestCase):
    def log_result(self, id, name, status, details=""):
        print(f"[{'✓' if status == 'PASS' else '✗'}] {id}: {name} -> {status} ({details})")

    # --- Section 5.1: Greenhouse Interior ---

    def test_5_1_1_potting_benches(self):
        """5.1.1: Potting bench objects created."""
        benches = [o for o in bpy.data.objects if 'PottingBench' in o.name]
        status = "PASS" if len(benches) >= 5 else "FAIL"
        self.log_result("5.1.1", "Potting Benches", status, f"Count: {len(benches)}")
        self.assertGreaterEqual(len(benches), 5)

    def test_5_1_2_display_island(self):
        """5.1.2: Display island object exists."""
        obj = bpy.data.objects.get("DisplayIsland")
        status = "PASS" if obj else "FAIL"
        self.log_result("5.1.2", "Display Island", status, "Exists" if obj else "Missing")
        self.assertIsNotNone(obj)

    def test_5_1_3_hanging_baskets(self):
        """5.1.3: Hanging baskets created and attached."""
        baskets = [o for o in bpy.data.objects if 'HangingBasket' in o.name]
        status = "PASS" if len(baskets) >= 5 else "FAIL"
        self.log_result("5.1.3", "Hanging Baskets", status, f"Count: {len(baskets)}")
        self.assertGreaterEqual(len(baskets), 5)

    # --- Section 5.2: Exterior Garden ---

    def test_5_2_1_hedge_row(self):
        """5.2.1: Hedge row objects created."""
        hedges = [o for o in bpy.data.objects if 'Hedge' in o.name]
        status = "PASS" if len(hedges) >= 4 else "FAIL"
        self.log_result("5.2.1", "Hedges", status, f"Count: {len(hedges)}")
        self.assertGreaterEqual(len(hedges), 4)

    def test_5_2_2_gravel_path(self):
        """5.2.2: Gravel path object exists."""
        obj = bpy.data.objects.get("GravelPath")
        status = "PASS" if obj else "FAIL"
        self.log_result("5.2.2", "Gravel Path", status, "Exists" if obj else "Missing")
        self.assertIsNotNone(obj)

    # --- Section 5.3: Rain System ---

    def test_5_3_1_rain_emitter(self):
        """5.3.1: Rain emitter object exists for shadow scene."""
        obj = bpy.data.objects.get("RainEmitter")
        status = "PASS" if obj and obj.particle_systems else "FAIL"
        self.log_result("5.3.1", "Rain Emitter", status, "Exists" if obj else "Missing")
        self.assertIsNotNone(obj)

    def test_5_3_2_rain_params(self):
        """5.3.2: Rain particle system configured for MEDIUM intensity."""
        obj = bpy.data.objects.get("RainEmitter")
        if obj and obj.particle_systems and len(obj.particle_systems) > 0:
            psys = obj.particle_systems[0]
            if not hasattr(psys, "settings") or not hasattr(psys.settings, "count"):
                self.skipTest("Legacy particle system settings not available")
                return
            count = psys.settings.count
            status = "PASS" if count == 6000 else "FAIL"
            self.log_result("5.3.2", "Rain Intensity", status, f"Count: {count}")
            self.assertEqual(count, 6000)

    def test_5_3_3_rain_range(self):
        """5.3.3: Rain frame range matches shadow scene (1801–2500)."""
        obj = bpy.data.objects.get("RainEmitter")
        if obj and obj.particle_systems and len(obj.particle_systems) > 0:
            psys = obj.particle_systems[0]
            if not hasattr(psys, "settings") or not hasattr(psys.settings, "frame_start"):
                self.skipTest("Legacy particle system settings not available")
                return
            start = psys.settings.frame_start
            end = psys.settings.frame_end
            status = "PASS" if (start == 1801 and end == 2500) else "FAIL"
            self.log_result("5.3.3", "Rain Range", status, f"Range: {start}-{end}")
            self.assertEqual(start, 1801)
            self.assertEqual(end, 2500)

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)

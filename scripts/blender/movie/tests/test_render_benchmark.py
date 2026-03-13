import bpy
import unittest
import time
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from base_test import BlenderTestCase

class TestRenderBenchmark(BlenderTestCase):
    def test_eevee_vs_cycles_performance(self):
        """Benchmark render time comparison of EEVEE vs Cycles."""
        scene = bpy.context.scene
        
        # Lower resolution and samples to keep the test rapid
        scene.render.resolution_x = 1280
        scene.render.resolution_y = 720
        scene.render.resolution_percentage = 10
        
        # Benchmark EEVEE
        # In blender 4.2+ this is BLENDER_EEVEE_NEXT
        try:
            scene.render.engine = 'BLENDER_EEVEE_NEXT'
        except TypeError:
            scene.render.engine = 'BLENDER_EEVEE'
            
        start_time_eevee = time.time()
        bpy.ops.render.render(write_still=False)
        eevee_time = time.time() - start_time_eevee
        self.log_result("Benchmark: EEVEE Render", "PASS", f"{eevee_time:.3f}s")
        
        # Benchmark CYCLES
        scene.render.engine = 'CYCLES'
        scene.cycles.samples = 16
        start_time_cycles = time.time()
        bpy.ops.render.render(write_still=False)
        cycles_time = time.time() - start_time_cycles
        self.log_result("Benchmark: CYCLES Render", "PASS", f"{cycles_time:.3f}s")
        
        self.assertTrue(eevee_time > 0, "EEVEE render failed to record time")
        self.assertTrue(cycles_time > 0, "CYCLES render failed to record time")

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv, exit=False)

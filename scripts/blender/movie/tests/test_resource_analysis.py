import bpy
import unittest
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from base_test import BlenderTestCase

class TestResourceAnalysis(BlenderTestCase):
    def test_polygon_count_budget(self):
        """Analyze total scene polygon count to prevent excessive resource consumption."""
        total_polygons = 0
        depsgraph = bpy.context.evaluated_depsgraph_get()
        
        for obj in bpy.context.scene.objects:
            if obj.type == 'MESH':
                eval_obj = obj.evaluated_get(depsgraph)
                try:
                    mesh = eval_obj.to_mesh()
                    total_polygons += len(mesh.polygons)
                    eval_obj.to_mesh_clear()
                except Exception:
                    pass
                
        # Defined budget limit for silent movie generation
        max_budget = 500000 
        
        status = "PASS" if total_polygons <= max_budget else "WARNING"
        self.log_result("Resource Analysis: Polygons", status, f"Total: {total_polygons}/{max_budget}")
        self.assertLessEqual(total_polygons, max_budget, 
                             f"Scene polygon count ({total_polygons}) exceeds maximum budget ({max_budget})")

    def test_object_density(self):
        """Analyze total object count in the scene."""
        object_count = len(bpy.context.scene.objects)
        max_budget = 2000
        
        status = "PASS" if object_count <= max_budget else "WARNING"
        self.log_result("Resource Analysis: Objects", status, f"Total: {object_count}/{max_budget}")
        self.assertLessEqual(object_count, max_budget, 
                             f"Scene object count ({object_count}) exceeds maximum budget ({max_budget})")

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv, exit=False)

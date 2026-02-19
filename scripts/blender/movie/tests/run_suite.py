import unittest
import sys
import os

# Add current directory to path to find modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from test_assets import TestAssets
from test_materials import TestMaterials
from test_animation import TestAnimation
from test_lighting import TestLighting
from test_compositor import TestCompositor
from test_render_preparedness import TestRenderPreparedness
from test_asset_details import TestAssetDetails
from test_scene_modules import TestSceneModules
from test_mouth_rig import TestMouthRig
from test_expression_rig import TestExpressionRig
from test_gnome_retreat import TestGnomeRetreat
from test_camera_choreography import TestCameraChoreography
from test_lighting_integrity import TestLightingIntegrity
from test_mesh_integrity_visibility import TestMeshIntegrity
from test_render_management import TestRenderManagement
from test_final_release_gate import TestReleaseGate
from test_interaction_scene import TestInteractionScene
from test_timeline_extension import test_timeline_bounds
# Note: test_timeline_extension is a script, not a unittest.TestCase, so we might skip it here or wrap it.

def run_all_tests():
    print("\n" + "="*50)
    print("GREENHOUSE MOVIE RENDER PREPAREDNESS SUITE")
    print("="*50)
    
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    suite.addTests(loader.loadTestsFromTestCase(TestAssets))
    suite.addTests(loader.loadTestsFromTestCase(TestMaterials))
    suite.addTests(loader.loadTestsFromTestCase(TestAnimation))
    suite.addTests(loader.loadTestsFromTestCase(TestLighting))
    suite.addTests(loader.loadTestsFromTestCase(TestCompositor))
    suite.addTests(loader.loadTestsFromTestCase(TestRenderPreparedness))
    suite.addTests(loader.loadTestsFromTestCase(TestAssetDetails))
    suite.addTests(loader.loadTestsFromTestCase(TestSceneModules))
    suite.addTests(loader.loadTestsFromTestCase(TestMouthRig))
    suite.addTests(loader.loadTestsFromTestCase(TestExpressionRig))
    suite.addTests(loader.loadTestsFromTestCase(TestGnomeRetreat))
    suite.addTests(loader.loadTestsFromTestCase(TestCameraChoreography))
    suite.addTests(loader.loadTestsFromTestCase(TestLightingIntegrity))
    suite.addTests(loader.loadTestsFromTestCase(TestMeshIntegrity))
    suite.addTests(loader.loadTestsFromTestCase(TestRenderManagement))
    suite.addTests(loader.loadTestsFromTestCase(TestReleaseGate))
    suite.addTests(loader.loadTestsFromTestCase(TestInteractionScene))
    
    runner = unittest.TextTestRunner(verbosity=2)
    runner.run(suite)

if __name__ == "__main__":
    # Filter out Blender arguments
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    
    run_all_tests()
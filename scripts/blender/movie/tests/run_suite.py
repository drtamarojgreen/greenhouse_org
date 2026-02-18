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
    
    runner = unittest.TextTestRunner(verbosity=2)
    runner.run(suite)

if __name__ == "__main__":
    # Filter out Blender arguments
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    
    run_all_tests()
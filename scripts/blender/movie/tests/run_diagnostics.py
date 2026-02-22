import unittest
import sys
import os

# Add parent directory to path to find base_test and other modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from test_render_diagnostics import TestRenderDiagnostics

def run_diagnostics():
    """
    Runs only the render diagnostics test suite.
    """
    print("\n" + "="*50)
    print("RUNNING BLENDER 5 RENDER DIAGNOSTICS")
    print("="*50)
    
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    suite.addTests(loader.loadTestsFromTestCase(TestRenderDiagnostics))
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Exit with a non-zero code if tests failed
    if not result.wasSuccessful():
        sys.exit(1)

if __name__ == "__main__":
    # Filter out Blender's arguments to avoid confusing the unittest module
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    
    # Re-assign sys.argv for unittest to process
    sys.argv = argv
    
    run_diagnostics()

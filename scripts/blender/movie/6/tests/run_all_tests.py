import bpy
import unittest
import sys
import os

# Ensure the test directory is in the path for module discovery
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
if TEST_DIR not in sys.path:
    sys.path.insert(0, TEST_DIR)

# Add parent directories to sys.path for modules like generate_scene6 and config
V6_DIR = os.path.abspath(os.path.join(TEST_DIR, '..'))
if V6_DIR not in sys.path:
    sys.path.insert(0, V6_DIR)
ASSETS_V6_DIR = os.path.join(V6_DIR, "assets_v6")
if ASSETS_V6_DIR not in sys.path:
    sys.path.insert(0, ASSETS_V6_DIR)

def run_tests():
    # Discover all tests in the current directory
    suite = unittest.TestLoader().discover(TEST_DIR)
    
    # Run the tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Exit with appropriate status code
    if not result.wasSuccessful():
        sys.exit(1)
    sys.exit(0)

if __name__ == "__main__":
    # Remove Blender's arguments if running inside Blender
    # This ensures unittest.main() doesn't get confused by Blender's args
    if '--' in sys.argv:
        idx = sys.argv.index('--')
        sys.argv = sys.argv[idx+1:]

    # Run the tests
    run_tests()

import unittest
import bpy
import os
import sys

# scripts/blender/movie/7/tests/run_all_tests.py
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
M7_DIR = os.path.dirname(TEST_DIR)

if M7_DIR not in sys.path:
    sys.path.insert(0, M7_DIR)

def run_tests():
    # Force registration by importing components
    import components
    components.initialize_registry()

    loader = unittest.TestLoader()
    suite = loader.discover(TEST_DIR)

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    if not result.wasSuccessful():
        sys.exit(1)
    sys.exit(0)

if __name__ == "__main__":
    run_tests()

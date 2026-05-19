import unittest
try:
    import bpy
except ImportError:
    bpy = None
import os
import sys

# scripts/blender/movie/10/tests/unit/run_all_tests.py
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
M10_ROOT = os.path.abspath(os.path.join(TEST_DIR, "..", ".."))

if M10_ROOT not in sys.path:
    sys.path.insert(0, M10_ROOT)

# Verify we can find the module
import importlib.util
spec = importlib.util.find_spec("movie_configuration")
if spec is None:
    # Try alternate pathing for Blender environment
    alt_root = os.path.join(os.getcwd(), "scripts", "blender", "movie", "10")
    if alt_root not in sys.path:
        sys.path.insert(0, alt_root)

try:
    import movie_configuration as mc
except ImportError:
    from . import movie_configuration as mc

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

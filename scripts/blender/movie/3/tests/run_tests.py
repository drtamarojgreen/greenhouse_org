import unittest
import sys
import os

# Add the script directory and its parent to path
current_dir = os.path.dirname(__file__)
sys.path.append(os.path.abspath(os.path.join(current_dir, "..")))
sys.path.append(os.path.abspath(os.path.join(current_dir, "../../../..")))

def run_tests():
    # Discover and run tests
    loader = unittest.TestLoader()
    suite = loader.discover(os.path.dirname(__file__), pattern="test_*.py")
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(not result.wasSuccessful())

if __name__ == "__main__":
    run_tests()

import bpy
import unittest
import sys
import os

# Ensure the test directory is in the path for module discovery
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
if TEST_DIR not in sys.path:
    sys.path.insert(0, TEST_DIR)

# Add parent directory to sys.path for Movie 7 modules
M7_DIR = os.path.abspath(os.path.join(TEST_DIR, '..'))
if M7_DIR not in sys.path:
    sys.path.insert(0, M7_DIR)

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
    run_tests()

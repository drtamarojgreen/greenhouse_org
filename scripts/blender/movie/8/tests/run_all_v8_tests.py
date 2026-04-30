# run_all_v8_tests.py - Consolidated test runner for Movie 8

import unittest
import sys
import os

def run_all_tests():
    print("\n" + "="*60)
    print("🎬 MOVIE 8 CONSOLIDATED TEST SUITE")
    print("="*60)

    # Define search directories
    base_dir = os.path.dirname(os.path.abspath(__file__))
    unit_dir = os.path.join(base_dir, "unit")
    bdd_dir = os.path.join(base_dir, "bdd")

    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Discover and add tests
    print(f"Discovering tests in:\n  - {unit_dir}\n  - {bdd_dir}")

    suite.addTests(loader.discover(unit_dir, pattern='test_*.py'))
    suite.addTests(loader.discover(bdd_dir, pattern='test_*.py'))

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    print("\n" + "="*60)
    if result.wasSuccessful():
        print("✅ ALL MOVIE 8 TESTS PASSED")
        return 0
    else:
        print("❌ SOME MOVIE 8 TESTS FAILED")
        return 1

if __name__ == "__main__":
    # Ensure blender doesn't interpret args
    if "--" in sys.argv:
        sys.argv = sys.argv[:sys.argv.index("--")]

    sys.exit(run_all_tests())

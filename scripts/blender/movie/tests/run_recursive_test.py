import unittest
import sys
import os

test_dir = os.path.dirname(os.path.abspath(__file__))
if test_dir not in sys.path:
    sys.path.insert(0, test_dir)

import test_animation_recursive

print(f"EP_DEBUG: Loaded module from: {test_animation_recursive.__file__}")

loader = unittest.TestLoader()
suite = loader.loadTestsFromTestCase(test_animation_recursive.TestAnimationSandbox)
runner = unittest.TextTestRunner(verbosity=2)
runner.run(suite)

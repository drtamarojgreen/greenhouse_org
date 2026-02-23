import unittest
import sys
import os

# Add parent directory to path to find modules
test_dir = os.path.dirname(os.path.abspath(__file__))
if test_dir not in sys.path:
    sys.path.insert(0, test_dir)

import test_animation_sandbox

print(f"EP_DEBUG: Loaded test_animation_sandbox module from: {getattr(test_animation_sandbox, '__file__', 'unknown')}")

def run_sandbox_test():
    """
    Runs only the animation sandbox test.
    """
    print("\n" + "="*50)
    print("RUNNING BLENDER 5 ANIMATION SANDBOX TEST")
    print("="*50)
    
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    suite.addTests(loader.loadTestsFromTestCase(test_animation_sandbox.TestAnimationSandbox))
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    if not result.wasSuccessful():
        sys.exit(1)

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    sys.argv = argv
    run_sandbox_test()

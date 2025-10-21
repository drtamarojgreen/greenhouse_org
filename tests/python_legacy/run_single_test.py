import unittest
import sys
import os

# Add the test directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from test_scheduler_rendering import TestSchedulerRendering

if __name__ == '__main__':
    suite = unittest.TestSuite()
    suite.addTest(unittest.makeSuite(TestSchedulerRendering))
    runner = unittest.TextTestRunner()
    result = runner.run(suite)
    if result.wasSuccessful():
        sys.exit(0)
    else:
        sys.exit(1)
import unittest
import bpy
import os
import sys

V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)

import config

class TestEnsembleIntegrity(unittest.TestCase):
    def test_ensemble_config_coverage(self):
        """Verify all ensemble spirits have defined target heights."""
        for art_name in config.SPIRIT_ENSEMBLE.values():
            self.assertIn(art_name, config.TARGET_HEIGHTS, f"Missing target height for spirit: {art_name}")

    def test_protagonist_definitions(self):
        """Verify protagonists are correctly mapped."""
        self.assertIsNotNone(config.CHAR_HERBACEOUS)
        self.assertIsNotNone(config.CHAR_ARBOR)
        self.assertIn(config.CHAR_HERBACEOUS, config.PROTAGONIST_SOURCE)
        self.assertIn(config.CHAR_ARBOR, config.PROTAGONIST_SOURCE)

if __name__ == '__main__':
    unittest.main()

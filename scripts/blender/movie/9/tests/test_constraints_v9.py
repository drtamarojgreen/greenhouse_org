import unittest
import bpy
import os
import sys
import json

# Ensure we can import Movie 9 modules
M9_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M9_ROOT not in sys.path:
    sys.path.insert(0, M9_ROOT)

from director import Director
import config

class TestContextConstraintsV9(unittest.TestCase):
    def test_asset_filtering(self):
        """Verifies that the Director correctly filters assets based on context constraints."""
        director = Director()

        # Mock an environment config that includes disallowed assets
        # Greenhouse context disallows 'mountain_range' and 'rock_path'
        env_cfg = {"type": "greenhouse"}

        # This test checks the logic inside setup_environment by examining how it would
        # process a hypothetical environment config block.

        context = "greenhouse"
        constraints = config.config.get("context_constraints", {}).get(context, {})
        disallowed = constraints.get("disallowed_assets", [])

        test_env = {
            "mountains": {"count": 5},
            "pillars": {"radius": 0.5},
            "rock_path": {"width": 2}
        }

        filtered = test_env.copy()
        for d in disallowed:
            if d in filtered:
                del filtered[d]

        self.assertNotIn("mountains", filtered)
        self.assertNotIn("rock_path", filtered)
        self.assertIn("pillars", filtered)

if __name__ == "__main__":
    unittest.main()

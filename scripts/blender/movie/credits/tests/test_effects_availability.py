import unittest
import subprocess
import sys
from pathlib import Path

# Add the parent directory to sys.path
sys.path.append(str(Path(__file__).parent.parent))
import render_credits

class TestEffectsAvailability(unittest.TestCase):
    def setUp(self):
        self.required_producers = ["pango", "kdenlivetitle", "color"]
        self.required_filters = ["frei0r.glow", "oldfilm"]
        self.required_transitions = ["composite", "luma"]

        try:
            self.melt_bin = render_credits.detect_melt()
        except RuntimeError:
            self.melt_bin = None

    def query_melt(self, query_type):
        if not self.melt_bin:
            return []
        try:
            result = subprocess.run([self.melt_bin, "-query", query_type], capture_output=True, text=True)
            if result.returncode == 0:
                # Melt queries usually return a list of services, one per line or YAML-like
                return result.stdout.lower()
            return ""
        except Exception:
            return ""

    def test_melt_producers_available(self):
        if not self.melt_bin:
            self.skipTest("MELT not found on system")

        available = self.query_melt("producers")
        for prod in self.required_producers:
            with self.subTest(producer=prod):
                self.assertIn(prod.lower(), available, f"Required producer '{prod}' not supported by system MELT")

    def test_melt_filters_available(self):
        if not self.melt_bin:
            self.skipTest("MELT not found on system")

        available = self.query_melt("filters")
        for filt in self.required_filters:
            with self.subTest(filter=filt):
                self.assertIn(filt.lower(), available, f"Required filter '{filt}' not supported by system MELT")

    def test_melt_transitions_available(self):
        if not self.melt_bin:
            self.skipTest("MELT not found on system")

        available = self.query_melt("transitions")
        for trans in self.required_transitions:
            with self.subTest(transition=trans):
                self.assertIn(trans.lower(), available, f"Required transition '{trans}' not supported by system MELT")

if __name__ == "__main__":
    unittest.main()

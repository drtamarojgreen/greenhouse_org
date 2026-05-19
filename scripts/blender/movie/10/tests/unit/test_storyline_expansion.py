import unittest
import os
import sys
import json

M10_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if M10_ROOT not in sys.path: sys.path.insert(0, M10_ROOT)

class TestMovie10StorylineExpansion(unittest.TestCase):
    def setUp(self):
        config_path = os.path.join(M10_ROOT, "movie_config.json")
        with open(config_path, 'r') as f:
            self.config = json.load(f)

    def test_frame_range(self):
        """Verifies the total frame count is exactly 10,000."""
        self.assertEqual(self.config["production"]["total_frames"], 10000)

    def test_new_characters_presence(self):
        """Verifies that all 4 new characters are in the ensemble."""
        ids = [e["id"] for e in self.config["ensemble"]["entities"]]
        new_chars = ["Lichen_HF", "Spore_HF", "Blight_HF", "Drone_X10"]
        for c in new_chars:
            self.assertIn(c, ids, f"Missing new character: {c}")

    def test_character_roles(self):
        """Verifies correct protagonist/antagonist assignments."""
        entities = {e["id"]: e for e in self.config["ensemble"]["entities"]}
        self.assertTrue(entities["Lichen_HF"]["is_protagonist"])
        self.assertTrue(entities["Spore_HF"]["is_protagonist"])
        self.assertFalse(entities["Blight_HF"]["is_protagonist"])
        self.assertFalse(entities["Drone_X10"]["is_protagonist"])

    def test_storyline_beats(self):
        """Verifies that storyline covers the extended frame range."""
        beats = self.config["storyline"]
        self.assertEqual(len(beats), 5)
        self.assertEqual(beats[-1]["end"], 10000)

if __name__ == "__main__":
    unittest.main()

import unittest
from unittest.mock import patch
import xml.etree.ElementTree as ET
from pathlib import Path
import sys
import io

# Add parent directory to sys.path
sys.path.append(str(Path(__file__).parent.parent))

import generate_header
import generate_final_credits
from reporting_utils import is_on_screen

class TestConfigVariations(unittest.TestCase):

    def test_header_config_variation(self):
        new_config = {
            "film_title": "Custom Title",
            "background_dark": "#FF0000",
            "header_segment_a_duration": 5,
            "fps": 24
        }

        with patch.dict(generate_header.CONFIG, new_config):
            # Redirect stdout to suppress print
            with patch('sys.stdout', new_io=io.StringIO()):
                generate_header.generate_header()

            output_path = Path(generate_header.__file__).parent / generate_header.CONFIG["output_dir"] / "header.kdenlive"
            tree = ET.parse(output_path)
            root = tree.getroot()

            # Verify film title
            c_title = root.find(".//producer[@id='c_title']")
            markup = c_title.find("property[@name='markup']").text
            self.assertIn("Custom Title", markup)

            # Verify background color
            bg_a = root.find(".//producer[@id='bg_a']")
            res = bg_a.find("property[@name='resource']").text
            self.assertEqual(res, "#FF0000")

            # Verify duration (5s * 24fps = 120 frames. out=119)
            bg_a_out = int(bg_a.get("out"))
            self.assertEqual(bg_a_out, 119)

    def test_credits_config_variation(self):
        new_config = {
            "cast": {"Abe": "Actor", "Bea": "Boss"},
            "credits_scroll_duration": 10,
            "fps": 30
        }

        with patch.dict(generate_final_credits.CONFIG, new_config):
            with patch('sys.stdout', new_io=io.StringIO()):
                generate_final_credits.generate_final_credits()

            output_path = Path(generate_final_credits.__file__).parent / generate_final_credits.CONFIG["output_dir"] / "final_credits.kdenlive"
            tree = ET.parse(output_path)
            root = tree.getroot()

            # Verify cast in xmldata
            credits_text = root.find(".//producer[@id='credits_text']")
            xmldata = credits_text.find("property[@name='xmldata']").text
            self.assertIn("Abe", xmldata)
            self.assertIn("Bea", xmldata)

            # Verify duration (10s * 30fps = 300 frames. out=299)
            bg = root.find(".//producer[@id='bg']")
            self.assertEqual(int(bg.get("out")), 299)

    def test_visibility_edge_cases(self):
        # Case 1: Fully on screen
        self.assertTrue(is_on_screen(0, 0, 1920, 1080))
        self.assertTrue(is_on_screen("10%", "10%", "80%", "80%"))

        # Case 2: Partially off screen (right)
        self.assertFalse(is_on_screen(1000, 0, 1000, 500))

        # Case 3: Fully off screen (top)
        self.assertFalse(is_on_screen(0, -500, 500, 400))

        # Case 4: Percentage off screen
        self.assertFalse(is_on_screen("110%", "0%", "10%", "10%"))

if __name__ == "__main__":
    unittest.main()

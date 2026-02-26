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
        # Create a temporary config file
        temp_config_path = Path("temp_header_config.yaml")
        temp_config = {
            "production": {
                "film_title": "Custom Title",
                "fps": 24,
                "width": 1920,
                "height": 1080,
                "output_dir": "output"
            },
            "header": {
                "segments": {
                    "a": {"duration": 5, "background": "#FF0000", "text": [
                        {"id": "c_title", "content": "Custom Title", "size": 144, "weight": "bold", "geometry": "0=0/0:100%x100%:100"}
                    ]}
                }
            }
        }
        import yaml
        with open(temp_config_path, "w") as f:
            yaml.dump(temp_config, f)

        try:
            with patch('sys.stdout', new_io=io.StringIO()):
                generate_header.generate_header(temp_config_path)

            output_path = Path(generate_header.__file__).parent / "output" / "header.kdenlive"
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
        finally:
            if temp_config_path.exists():
                temp_config_path.unlink()

    def test_credits_config_variation(self):
        temp_config_path = Path("temp_credits_config.yaml")
        temp_config = {
            "production": {
                "film_title": "Custom Film",
                "fps": 30,
                "width": 1920,
                "height": 1080,
                "output_dir": "output"
            },
            "credits": {
                "duration": 10,
                "background": "#000000",
                "cast": {"Abe": "Actor", "Bea": "Boss"},
                "scroll": {"geometry": "0=0/1080:1920x3000:100; 299=0/-3000:1920x3000:100"}
            }
        }
        import yaml
        with open(temp_config_path, "w") as f:
            yaml.dump(temp_config, f)

        try:
            with patch('sys.stdout', new_io=io.StringIO()):
                generate_final_credits.generate_final_credits(temp_config_path)

            output_path = Path(generate_final_credits.__file__).parent / "output" / "final_credits.kdenlive"
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
        finally:
            if temp_config_path.exists():
                temp_config_path.unlink()

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

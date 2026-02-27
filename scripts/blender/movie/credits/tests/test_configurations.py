import unittest
import xml.etree.ElementTree as ET
from pathlib import Path
import sys
import os
import yaml

# Add parent directory to sys.path
sys.path.append(str(Path(__file__).parent.parent))

from generate_header import generate_header
from generate_final_credits import generate_final_credits

class TestConfigurations(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.test_config_path = Path("test_config.yaml")
        cls.test_config = {
            "production": {
                "film_title": "Test Cinematic",
                "studio_name": "Test Studio",
                "fps": 30,
                "width": 1280,
                "height": 720,
                "output_dir": "test_output"
            },
            "header": {
                "segments": {
                    "a": {"duration": 2, "background": "#FF00FF", "text": [
                        {"id": "t1", "content": "Hello World", "size": 50, "weight": "normal", "geometry": "0=0/0:100%x100%:100"}
                    ]}
                }
            },
            "credits": {
                "duration": 5,
                "background": "#112233",
                "font": {"family": "Arial", "size": 24, "weight": 40},
                "cast": {"Alice": "Testing"},
                "scroll": {"geometry": "0=0/720:1280x1000:100; 149=0/-1000:1280x1000:100"}
            }
        }
        with open(cls.test_config_path, "w") as f:
            yaml.dump(cls.test_config, f)

    @classmethod
    def tearDownClass(cls):
        if cls.test_config_path.exists():
            cls.test_config_path.unlink()

    def test_custom_header_configuration(self):
        generate_header(self.test_config_path)
        output_path = Path(__file__).parent.parent / "test_output" / "header.kdenlive"
        self.assertTrue(output_path.exists())

        tree = ET.parse(output_path)
        root = tree.getroot()

        # Verify color
        bg_a = root.find(".//producer[@id='bg_a']")
        self.assertEqual(bg_a.find("property[@name='resource']").text, "#FF00FF")

        # Verify text
        t1 = root.find(".//producer[@id='t1']")
        self.assertIn("Hello World", t1.find("property[@name='markup']").text)

        # Verify profile
        profile = root.find("profile")
        self.assertEqual(profile.get("width"), "1280")
        self.assertEqual(profile.get("height"), "720")

    def test_custom_credits_configuration(self):
        generate_final_credits(self.test_config_path)
        output_path = Path(__file__).parent.parent / "test_output" / "final_credits.kdenlive"
        self.assertTrue(output_path.exists())

        tree = ET.parse(output_path)
        root = tree.getroot()

        # Verify background
        bg = root.find(".//producer[@id='bg']")
        self.assertEqual(bg.find("property[@name='resource']").text, "#112233")

        # Verify cast
        credits_text = root.find(".//producer[@id='credits_text']")
        xmldata = credits_text.find("property[@name='xmldata']").text
        self.assertIn("Alice", xmldata)

        # Verify scroll geometry
        geom = credits_text.find("property[@name='geometry']").text
        self.assertIn("0=0/720:1280x1000:100", geom)

if __name__ == "__main__":
    unittest.main()

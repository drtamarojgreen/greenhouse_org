import unittest
import yaml
from pathlib import Path
import sys
import os

# Add parent directory to sys.path
sys.path.append(str(Path(__file__).parent.parent))
import config_loader

class TestConfigLoader(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.test_yaml_path = Path("unit_test_config.yaml")
        cls.test_data = {
            "production": {
                "film_title": "Unit Test Film",
                "year": 2025,
                "fps": 24
            },
            "header": {
                "segments": {"a": {"duration": 10}}
            },
            "credits": {
                "duration": 60
            }
        }
        with open(cls.test_yaml_path, "w") as f:
            yaml.dump(cls.test_data, f)

    @classmethod
    def tearDownClass(cls):
        if cls.test_yaml_path.exists():
            cls.test_yaml_path.unlink()

    def test_load_config_success(self):
        config = config_loader.load_config(self.test_yaml_path)
        self.assertEqual(config["production"]["film_title"], "Unit Test Film")
        self.assertEqual(config["production"]["year"], 2025)

    def test_get_production_settings(self):
        config = self.test_data
        settings = config_loader.get_production_settings(config)
        self.assertEqual(settings["fps"], 24)
        self.assertEqual(settings["film_title"], "Unit Test Film")

    def test_get_header_config(self):
        config = self.test_data
        header = config_loader.get_header_config(config)
        self.assertEqual(header["segments"]["a"]["duration"], 10)

    def test_get_credits_config(self):
        config = self.test_data
        credits = config_loader.get_credits_config(config)
        self.assertEqual(credits["duration"], 60)

    def test_missing_keys_fallback(self):
        empty_config = {}
        self.assertEqual(config_loader.get_production_settings(empty_config), {})
        self.assertEqual(config_loader.get_header_config(empty_config), {})
        self.assertEqual(config_loader.get_credits_config(empty_config), {})

if __name__ == "__main__":
    unittest.main()

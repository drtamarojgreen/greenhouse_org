import unittest
import xml.etree.ElementTree as ET
from pathlib import Path
import sys

# Add the parent directory to sys.path to import generate_final_credits
sys.path.append(str(Path(__file__).parent.parent))
from generate_final_credits import generate_final_credits
import config_loader
from reporting_utils import get_contrast_ratio, parse_geometry, resolve_to_pixels

class TestFinalCreditsXML(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Ensure the final_credits.kdenlive is generated before tests
        generate_final_credits()
        cls.output_path = Path(__file__).parent.parent / "output" / "final_credits.kdenlive"

    def test_file_exists(self):
        self.assertTrue(self.output_path.exists(), "final_credits.kdenlive was not generated")

    def test_is_valid_xml(self):
        try:
            tree = ET.parse(self.output_path)
            self.root = tree.getroot()
        except ET.ParseError:
            self.fail("final_credits.kdenlive is not a valid XML file")

    def test_root_is_mlt(self):
        tree = ET.parse(self.output_path)
        root = tree.getroot()
        self.assertEqual(root.tag, "mlt")
        self.assertEqual(root.get("producer"), "main_tractor")

    def test_mlt_properties(self):
        tree = ET.parse(self.output_path)
        root = tree.getroot()
        credits_text = root.find(".//producer[@id='credits_text']")
        self.assertIsNotNone(credits_text)
        self.assertEqual(credits_text.find("property[@name='mlt_service']").text, "kdenlivetitle")
        self.assertIsNotNone(credits_text.find("property[@name='xmldata']"))

    def test_filter_film_grain(self):
        tree = ET.parse(self.output_path)
        root = tree.getroot()
        tractor = root.find(".//tractor[@id='main_tractor']")
        filter_film = None
        for f in tractor.findall("filter"):
            svc = f.find("property[@name='mlt_service']")
            if svc is not None and svc.text == "frei0r.film":
                filter_film = f
                break
        self.assertIsNotNone(filter_film, "frei0r.film filter not found on main_tractor")

    def test_composite_transition(self):
        tree = ET.parse(self.output_path)
        root = tree.getroot()
        tractor = root.find(".//tractor[@id='main_tractor']")
        comp = None
        for trans in tractor.findall("transition"):
            svc = trans.find("property[@name='mlt_service']")
            if svc is not None and svc.text == "composite":
                comp = trans
                break
        self.assertIsNotNone(comp, "Composite transition not found on main_tractor")
        self.assertEqual(comp.find("property[@name='a_track']").text, "0")
        self.assertEqual(comp.find("property[@name='b_track']").text, "1")

    def test_cast_presence(self):
        full_config = config_loader.load_config()
        credits_cfg = config_loader.get_credits_config(full_config)
        with open(self.output_path, 'r', encoding='utf-8') as f:
            content = f.read()
        self.assertIn("CAST", content)
        self.assertIn("Tamaro Green", content)
        for char in credits_cfg.get("cast", {}):
            self.assertIn(char, content)

    def test_scroll_geometry(self):
        tree = ET.parse(self.output_path)
        root = tree.getroot()
        # Find the producer that handles the scroll
        producer = root.find(".//producer[@id='credits_text']")
        self.assertIsNotNone(producer)
        geom = producer.find("property[@name='geometry']")
        self.assertIsNotNone(geom)
        geom_text = geom.text
        # Check for two keyframes (0=...; last=...)
        self.assertIn(";", geom_text)
        # Check for Y movement (scroll)
        # We expect something like 0=0/1080:... ; end=0/-2500:...
        self.assertIn("0/", geom_text)
        self.assertIn("-", geom_text)

    def test_scroll_alignment_and_font(self):
        tree = ET.parse(self.output_path)
        root = tree.getroot()

        prod = root.find(".//producer[@id='credits_text']")
        xmldata = prod.find("property[@name='xmldata']").text
        title_root = ET.fromstring(xmldata)

        # Verify Font Size
        font = title_root.find(".//font")
        self.assertEqual(font.get("size"), "36")

        # Verify Scroll Boundaries
        geom = prod.find("property[@name='geometry']").text
        keyframes = parse_geometry(geom)

        # We expect 2 keyframes for the scroll
        self.assertEqual(len(keyframes), 2)

        # Start keyframe (off-screen bottom)
        start = keyframes[0]
        self.assertEqual(resolve_to_pixels(start['x'], 1920), 0)
        self.assertEqual(resolve_to_pixels(start['y'], 1080), 1080)
        self.assertEqual(resolve_to_pixels(start['w'], 1920), 1920)

        # End keyframe (off-screen top)
        end = keyframes[1]
        self.assertEqual(resolve_to_pixels(end['x'], 1920), 0)
        self.assertEqual(resolve_to_pixels(end['y'], 1080), -3000)

    def test_colors_and_contrast(self):
        tree = ET.parse(self.output_path)
        root = tree.getroot()

        # Background color
        bg = root.find(".//producer[@id='bg']")
        res = bg.find("property[@name='resource']").text
        # Default is black
        self.assertEqual(res.lower(), "#000000")

        # Text color from kdenlivetitle xmldata
        credits_text = root.find(".//producer[@id='credits_text']")
        xmldata = credits_text.find("property[@name='xmldata']").text
        title_root = ET.fromstring(xmldata)
        font_color = title_root.find(".//font-color")

        r = int(font_color.get("red"))
        g = int(font_color.get("green"))
        b = int(font_color.get("blue"))

        self.assertEqual((r, g, b), (255, 255, 255))

        ratio = get_contrast_ratio("#000000", (r/255.0, g/255.0, b/255.0))
        self.assertGreaterEqual(ratio, 4.5)

    def test_total_duration(self):
        tree = ET.parse(self.output_path)
        root = tree.getroot()
        bg = root.find(".//producer[@id='bg']")
        out_val = int(bg.get("out"))
        # 90s * 25fps = 2250 frames. out is duration-1.
        self.assertGreaterEqual(out_val, 2249)

if __name__ == "__main__":
    unittest.main()

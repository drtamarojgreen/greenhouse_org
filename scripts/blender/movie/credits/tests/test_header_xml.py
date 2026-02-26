import unittest
import xml.etree.ElementTree as ET
from pathlib import Path
import os
import sys

# Add the parent directory to sys.path to import generate_header
sys.path.append(str(Path(__file__).parent.parent))
from generate_header import generate_header, CONFIG
from reporting_utils import get_contrast_ratio, parse_pango_color, parse_geometry, is_on_screen

class TestHeaderXML(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Ensure the header.kdenlive is generated before tests
        # We use default config for base tests
        generate_header()
        cls.output_path = Path(__file__).parent.parent / "output" / "header.kdenlive"

    def test_file_exists(self):
        self.assertTrue(self.output_path.exists(), "header.kdenlive was not generated")

    def test_is_valid_xml(self):
        try:
            tree = ET.parse(self.output_path)
            self.root = tree.getroot()
        except ET.ParseError:
            self.fail("header.kdenlive is not a valid XML file")

    def test_root_is_mlt(self):
        tree = ET.parse(self.output_path)
        root = tree.getroot()
        self.assertEqual(root.tag, "mlt")
        self.assertEqual(root.get("producer"), "main_tractor")

    def test_producer_properties(self):
        tree = ET.parse(self.output_path)
        root = tree.getroot()
        # Check a few specific producers
        a1 = root.find(".//producer[@id='a1']")
        self.assertIsNotNone(a1)
        self.assertEqual(a1.find("property[@name='mlt_service']").text, "pango")
        self.assertIn("GreenhouseMD", a1.find("property[@name='markup']").text)

        bg_a = root.find(".//producer[@id='bg_a']")
        self.assertIsNotNone(bg_a)
        self.assertEqual(bg_a.find("property[@name='mlt_service']").text, "color")

    def test_producer_count(self):
        tree = ET.parse(self.output_path)
        root = tree.getroot()
        producers = root.findall("producer")
        # bg_a, a1, a2, bg_b, b1, bg_c, c_title
        expected_count = 7
        self.assertEqual(len(producers), expected_count)

    def test_required_text_content(self):
        with open(self.output_path, 'r', encoding='utf-8') as f:
            content = f.read()
        self.assertIn("GreenhouseMD", content)
        self.assertIn("Production Studio", content)
        self.assertIn(CONFIG["film_title"], content)

    def test_filter_glow(self):
        tree = ET.parse(self.output_path)
        root = tree.getroot()
        # Find the glow filter specifically on main_tractor
        tractor = root.find(".//tractor[@id='main_tractor']")
        filter_glow = None
        for f in tractor.findall("filter"):
            svc = f.find("property[@name='mlt_service']")
            if svc is not None and svc.text == "frei0r.glow":
                filter_glow = f
                break

        self.assertIsNotNone(filter_glow, "frei0r.glow filter not found on main_tractor")

        blur_prop = filter_glow.find("property[@name='blur']")
        self.assertIsNotNone(blur_prop)
        self.assertEqual(blur_prop.text, "0.02")

    def test_transitions_completeness(self):
        tree = ET.parse(self.output_path)
        root = tree.getroot()
        # Check for composite transitions in segment tractors
        for tid in ["tractor_a", "tractor_b", "tractor_c"]:
            tractor = root.find(f".//tractor[@id='{tid}']")
            comp_found = False
            for trans in tractor.findall("transition"):
                svc = trans.find("property[@name='mlt_service']")
                if svc is not None and svc.text == "composite":
                    comp_found = True
                    break
            self.assertTrue(comp_found, f"Composite transition missing in {tid}")

        # Check for luma transitions in main tractor
        main_tractor = root.find(".//tractor[@id='main_tractor']")
        luma_count = 0
        for trans in main_tractor.findall("transition"):
            svc = trans.find("property[@name='mlt_service']")
            if svc is not None and svc.text == "luma":
                luma_count += 1
                a_track = trans.find("property[@name='a_track']").text
                b_track = trans.find("property[@name='b_track']").text
                if luma_count == 1:
                    self.assertEqual(a_track, "0")
                    self.assertEqual(b_track, "1")
                else:
                    self.assertEqual(a_track, "1")
                    self.assertEqual(b_track, "0")
        self.assertEqual(luma_count, 2, "Expected 2 luma transitions in main_tractor")

    def test_alignment_and_visibility(self):
        tree = ET.parse(self.output_path)
        root = tree.getroot()

        producers = root.findall(".//producer")
        for prod in producers:
            service = prod.find("property[@name='mlt_service']")
            if service is not None and service.text == "pango":
                # Verify alignment
                align = prod.find("property[@name='align']")
                self.assertIsNotNone(align)
                self.assertEqual(align.text, "centre")

                # Verify dimensions
                width = prod.find("property[@name='width']")
                height = prod.find("property[@name='height']")
                self.assertIsNotNone(width)
                self.assertIsNotNone(height)
                self.assertEqual(width.text, "1920")

                # Verify visibility in transitions
                prod_id = prod.get("id")
                for tractor in root.findall(".//tractor"):
                    # We look for transitions in tractors that might use this track.
                    # This is simplified: check all geometry transitions in the same project.
                    for trans in tractor.findall("transition"):
                        geom_prop = trans.find("property[@name='geometry']")
                        if geom_prop is not None:
                            keyframes = parse_geometry(geom_prop.text)
                            for kf in keyframes:
                                if kf['opacity'] > 0:
                                    visible = is_on_screen(kf['x'], kf['y'], kf['w'], kf['h'])
                                    self.assertTrue(visible, f"Text {prod_id} off-screen at frame {kf['frame']}")

    def test_colors_and_contrast(self):
        tree = ET.parse(self.output_path)
        root = tree.getroot()

        # Segment background colors
        bg_configs = {
            "bg_a": CONFIG["background_dark"],
            "bg_b": CONFIG["background_black"],
            "bg_c": CONFIG["background_black"]
        }

        for bg_id, expected_hex in bg_configs.items():
            bg_prod = root.find(f".//producer[@id='{bg_id}']")
            self.assertIsNotNone(bg_prod)
            res = bg_prod.find("property[@name='resource']").text
            self.assertEqual(res.lower(), expected_hex.lower(), f"{bg_id} color mismatch")

        # Pango text colors and contrast
        # Segment A: Dark background, White text
        a1 = root.find(".//producer[@id='a1']")
        markup = a1.find("property[@name='markup']").text
        text_color = parse_pango_color(markup)
        self.assertEqual(text_color, "white")

        ratio = get_contrast_ratio(CONFIG["background_dark"], "white")
        # Greenhouse mandates 4.5:1
        self.assertGreaterEqual(ratio, 4.5, f"Contrast segment A {ratio:.2f} < 4.5")

        # Segment B/C: Black background, White text
        ratio_black = get_contrast_ratio(CONFIG["background_black"], "white")
        self.assertGreaterEqual(ratio_black, 4.5, f"Contrast segment B/C {ratio_black:.2f} < 4.5")

    def test_total_duration(self):
        tree = ET.parse(self.output_path)
        root = tree.getroot()
        tractor = root.find(".//tractor[@id='main_tractor']")
        self.assertIsNotNone(tractor.get("out"), "main_tractor should have an 'out' attribute")
        out_val = int(tractor.get("out"))
        # 12 + (15-1) + 15 = 41s * 25fps = 1025 frames. out is 1024.
        self.assertEqual(out_val, 1024)

if __name__ == "__main__":
    unittest.main()

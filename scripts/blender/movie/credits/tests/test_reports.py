import unittest
import xml.etree.ElementTree as ET
from pathlib import Path
import sys
import os

# Add relevant directories to sys.path
sys.path.append(str(Path(__file__).parent.parent))
from reporting_utils import parse_geometry, extract_pango_text, get_contrast_ratio, parse_pango_color, is_on_screen

class TestReports(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base_dir = Path(__file__).parent.parent
        cls.output_dir = cls.base_dir / "output"
        cls.header_xml = cls.output_dir / "header.kdenlive"
        cls.credits_xml = cls.output_dir / "final_credits.kdenlive"

    def test_generate_header_report(self):
        self.assertTrue(self.header_xml.exists(), "header.kdenlive must exist")
        tree = ET.parse(self.header_xml)
        root = tree.getroot()

        report_lines = ["HEADER TEXT PLACEMENT & ANIMATION REPORT", "="*40, ""]

        # Look for text producers (pango)
        producers = root.findall(".//producer")
        for prod in producers:
            service = prod.find("property[@name='mlt_service']")
            if service is not None and service.text == "pango":
                prod_id = prod.get("id")
                markup = prod.find("property[@name='markup']").text
                text = extract_pango_text(markup)
                text_color = parse_pango_color(markup)

                # Determine background color based on segment
                bg_color = "#000000"
                if prod_id.startswith('a'): bg_color = "#1a1a1a"

                contrast = get_contrast_ratio(bg_color, text_color)

                align = prod.find("property[@name='align']").text if prod.find("property[@name='align']") is not None else "N/A"

                report_lines.append(f"Producer ID: {prod_id}")
                report_lines.append(f"Text: {text}")
                report_lines.append(f"Alignment: {align}")
                report_lines.append(f"Colors: FG={text_color}, BG={bg_color}")
                report_lines.append(f"Contrast Ratio: {contrast:.2f}:1")

                visibility_ok = True
                # Find transitions that use this producer
                for tractor in root.findall(".//tractor"):
                    for trans in tractor.findall("transition"):
                        b_track = trans.find("property[@name='b_track']")
                        if b_track is not None:
                            # This is a bit complex as track index depends on tractor.
                            # For simplicity in this script, we'll look for geometry property
                            geom = trans.find("property[@name='geometry']")
                            if geom is not None:
                                # We'll just list geometry found in the same tractor for now
                                keyframes = parse_geometry(geom.text)
                                if keyframes:
                                    report_lines.append("Animation Keyframes:")
                                    for kf in keyframes:
                                        on_screen = is_on_screen(kf['x'], kf['y'], kf['w'], kf['h'])
                                        status = "ON-SCREEN" if on_screen else "OFF-SCREEN"
                                        if kf['opacity'] > 0 and not on_screen:
                                            visibility_ok = False
                                        report_lines.append(f"  Frame {kf['frame']}: Pos({kf['x']},{kf['y']}) Size({kf['w']}x{kf['h']}) Opacity({kf['opacity']}) [{status}]")

                report_lines.append(f"Visibility Check: {'PASS' if visibility_ok else 'FAIL'}")
                report_lines.append("-" * 20)

        report_path = self.output_dir / "header_report.txt"
        with open(report_path, "w") as f:
            f.write("\n".join(report_lines))
        print(f"\n[report] Written {report_path}")
        self.assertTrue(report_path.exists())

    def test_generate_credits_report(self):
        self.assertTrue(self.credits_xml.exists(), "final_credits.kdenlive must exist")
        tree = ET.parse(self.credits_xml)
        root = tree.getroot()

        report_lines = ["FINAL CREDITS TEXT PLACEMENT & ANIMATION REPORT", "="*48, ""]

        # Look for kdenlivetitle producers
        producers = root.findall(".//producer")
        for prod in producers:
            service = prod.find("property[@name='mlt_service']")
            if service is not None and service.text == "kdenlivetitle":
                prod_id = prod.get("id")
                # xmldata contains the title xml
                xmldata = prod.find("property[@name='xmldata']").text
                title_root = ET.fromstring(xmldata)
                content = title_root.find(".//content").text

                font_color = title_root.find(".//font-color")
                r, g, b = int(font_color.get("red")), int(font_color.get("green")), int(font_color.get("blue"))
                text_color_rgb = (r/255.0, g/255.0, b/255.0)
                bg_color = "#000000" # Known background for final credits
                contrast = get_contrast_ratio(bg_color, text_color_rgb)

                report_lines.append(f"Producer ID: {prod_id}")
                report_lines.append(f"Content Snippet: {content[:100].replace('\\n', ' ')}...")
                report_lines.append(f"Alignment: Center (Implicit)")
                report_lines.append(f"Colors: FG=rgb({r},{g},{b}), BG={bg_color}")
                report_lines.append(f"Contrast Ratio: {contrast:.2f}:1")

                geom_prop = prod.find("property[@name='geometry']")
                if geom_prop is not None:
                    keyframes = parse_geometry(geom_prop.text)
                    report_lines.append("Animation (Scroll) Keyframes:")
                    for kf in keyframes:
                        report_lines.append(f"  Frame {kf['frame']}: Pos({kf['x']},{kf['y']}) Size({kf['w']}x{kf['h']}) Opacity({kf['opacity']})")
                report_lines.append("-" * 20)

        report_path = self.output_dir / "credits_report.txt"
        with open(report_path, "w") as f:
            f.write("\n".join(report_lines))
        print(f"\n[report] Written {report_path}")
        self.assertTrue(report_path.exists())

if __name__ == "__main__":
    unittest.main()

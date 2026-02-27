import unittest
import subprocess
import json
import os
from pathlib import Path
import sys
from unittest.mock import patch

# Add parent directory to sys.path
sys.path.append(str(Path(__file__).parent.parent))

import render_credits
import generate_header
import generate_final_credits

class TestVisualOutput(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base_dir = Path(__file__).parent.parent
        cls.output_dir = cls.base_dir / "output"
        cls.test_config_path = Path("visual_test_config.yaml")

        # Create a tiny config for fast rendering
        cls.tiny_config = {
            "production": {
                "film_title": "Visual Test",
                "fps": 25,
                "width": 1920,
                "height": 1080,
                "output_dir": "output"
            },
            "header": {
                "segments": {
                    "a": {"duration": 1, "background": "#123456", "text": [
                        {"id": "t1", "content": "Test", "size": 100, "weight": "normal", "geometry": "0=0/0:100%x100%:100"}
                    ]}
                },
                "filters": []
            },
            "credits": {
                "duration": 1,
                "background": "#000000",
                "font": {"family": "DejaVu Sans", "size": 36, "weight": 50},
                "cast": {"A": "B"},
                "scroll": {"geometry": "0=0/0:1920x1080:100; 24=0/0:1920x1080:100"}
            }
        }
        import yaml
        with open(cls.test_config_path, "w") as f:
            yaml.dump(cls.tiny_config, f)

    @classmethod
    def tearDownClass(cls):
        if cls.test_config_path.exists():
            cls.test_config_path.unlink()

    def probe_file(self, filepath):
        cmd = [
            "ffprobe", "-v", "quiet", "-print_format", "json",
            "-show_streams", "-show_format", str(filepath)
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)
        return json.loads(result.stdout)

    def test_render_and_verify_header(self):
        # Generate and Render
        generate_header.generate_header(self.test_config_path)
        melt_bin = render_credits.detect_melt()
        input_xml = self.output_dir / "header.kdenlive"
        output_mp4 = self.output_dir / "header_test.mp4"

        if output_mp4.exists(): output_mp4.unlink()

        render_credits.render_project(melt_bin, input_xml, output_mp4)

        self.assertTrue(output_mp4.exists())
        self.assertGreater(output_mp4.stat().st_size, 5000)

        # Verify Metadata
        data = self.probe_file(output_mp4)
        video_stream = next(s for s in data['streams'] if s['codec_type'] == 'video')

        self.assertEqual(int(video_stream['width']), 1920)
        self.assertEqual(int(video_stream['height']), 1080)
        self.assertEqual(video_stream['avg_frame_rate'], '25/1')

        # Extract Frame
        frame_path = self.output_dir / "header_frame.png"
        if frame_path.exists(): frame_path.unlink()

        extract_cmd = [
            "ffmpeg", "-i", str(output_mp4), "-ss", "00:00:00.500",
            "-vframes", "1", str(frame_path)
        ]
        subprocess.run(extract_cmd, capture_output=True)

        self.assertTrue(frame_path.exists())
        self.assertGreater(frame_path.stat().st_size, 0)

    def test_render_and_verify_credits(self):
        generate_final_credits.generate_final_credits(self.test_config_path)
        melt_bin = render_credits.detect_melt()
        input_xml = self.output_dir / "final_credits.kdenlive"
        output_mp4 = self.output_dir / "credits_test.mp4"

        if output_mp4.exists(): output_mp4.unlink()

        render_credits.render_project(melt_bin, input_xml, output_mp4)

        self.assertTrue(output_mp4.exists())

        data = self.probe_file(output_mp4)
        video_stream = next(s for s in data['streams'] if s['codec_type'] == 'video')
        self.assertEqual(int(video_stream['width']), 1920)
        self.assertEqual(int(video_stream['height']), 1080)

if __name__ == "__main__":
    unittest.main()

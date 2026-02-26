import unittest
from unittest.mock import patch, MagicMock
from pathlib import Path
import os
import sys

# Add the parent directory to sys.path to import render_credits
sys.path.append(str(Path(__file__).parent.parent))
import render_credits

class TestRenderCredits(unittest.TestCase):

    @patch('subprocess.run')
    def test_detect_melt_success(self, mock_run):
        mock_run.return_value = MagicMock(returncode=0)
        # Test when 'melt' works
        with patch.dict(os.environ, {"MELT_BIN": ""}):
            melt_bin = render_credits.detect_melt()
            # It should try os.environ.get("MELT_BIN") (None/Empty), then "melt"
            self.assertEqual(melt_bin, "melt")

    @patch('subprocess.run')
    def test_detect_melt_env_var(self, mock_run):
        mock_run.return_value = MagicMock(returncode=0)
        with patch.dict(os.environ, {"MELT_BIN": "/custom/path/melt"}):
            melt_bin = render_credits.detect_melt()
            self.assertEqual(melt_bin, "/custom/path/melt")

    @patch('subprocess.run')
    def test_detect_melt_failure(self, mock_run):
        mock_run.side_effect = FileNotFoundError
        with patch.dict(os.environ, {"MELT_BIN": ""}):
            with self.assertRaises(RuntimeError):
                render_credits.detect_melt()

    def test_get_xml_duration_valid(self):
        # Create a temporary XML file
        content = '<mlt producer="main"><tractor id="main" out="999"/></mlt>'
        test_file = Path("test_dur.kdenlive")
        with open(test_file, "w") as f:
            f.write(content)

        try:
            dur = render_credits.get_xml_duration(test_file)
            self.assertEqual(dur, 999)
        finally:
            if test_file.exists():
                test_file.unlink()

    def test_get_xml_duration_missing_producer(self):
        content = '<mlt><tractor id="main" out="999"/></mlt>'
        test_file = Path("test_dur_missing.kdenlive")
        with open(test_file, "w") as f:
            f.write(content)

        try:
            dur = render_credits.get_xml_duration(test_file)
            self.assertIsNone(dur)
        finally:
            if test_file.exists():
                test_file.unlink()

    @patch('subprocess.Popen')
    def test_render_project(self, mock_popen):
        mock_proc = MagicMock()
        mock_proc.returncode = 0
        mock_proc.stdout = iter(["line1\n", "line2\n"])
        mock_proc.__enter__.return_value = mock_proc
        mock_popen.return_value = mock_proc

        input_xml = Path("dummy.kdenlive")
        output_mp4 = Path("dummy.mp4")

        # Create dummy input file
        with open(input_xml, "w") as f:
            f.write('<mlt producer="main"><tractor id="main" out="999"/></mlt>')

        try:
            # Mock Path.exists and stat for output file
            # We need to be careful with mocking Path.exists as it's used internally
            with patch("render_credits.Path.exists") as mock_exists:
                # dummy.kdenlive exists (input), dummy.mp4 exists (output check)
                mock_exists.side_effect = lambda: True

                with patch("render_credits.Path.stat") as mock_stat:
                    mock_stat.return_value.st_size = 1024 * 1024 # 1MB
                    render_credits.render_project("melt", input_xml, output_mp4)

            mock_popen.assert_called()
        finally:
            # Cleanup dummy input
            if input_xml.exists():
                input_xml.unlink()

if __name__ == "__main__":
    unittest.main()

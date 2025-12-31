
import unittest
import subprocess
import os
import tempfile

class TestLogoAnimation(unittest.TestCase):

    def setUp(self):
        """Set up the test environment using a temporary directory."""
        self.base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
        # Create a temporary directory that will be automatically cleaned up
        self.temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp_dir.cleanup)

        # Define temporary file paths within the secure temporary directory
        self.temp_svg_file = os.path.join(self.temp_dir.name, 'test_logo.svg')
        self.temp_output_video = os.path.join(self.temp_dir.name, 'test_animation.mkv')

        # Create a simple dummy SVG for the test
        dummy_svg_content = """<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" stroke="blue" stroke-width="4" fill="red" />
</svg>"""
        with open(self.temp_svg_file, 'w') as f:
            f.write(dummy_svg_content)

    def test_logo_animation_rendering(self):
        """
        Tests the rendering pipeline using a temporary SVG and command-line arguments.
        """
        render_script = os.path.join(self.base_dir, 'scripts', 'blender', 'render_logo_animation.py')

        command = [
            'blender', '--background', '--python', render_script, '--',
            '--input-svg', self.temp_svg_file,
            '--output-mkv', self.temp_output_video
        ]

        try:
            result = subprocess.run(
                command,
                capture_output=True, text=True, timeout=300
            )
        except FileNotFoundError:
            self.fail("Blender is not installed or not in the system's PATH.")
        except subprocess.TimeoutExpired:
            self.fail("Blender rendering process timed out.")

        self.assertEqual(result.returncode, 0, f"Blender rendering script failed with stderr:\n{result.stderr}")

        # Verify the output
        self.assertTrue(os.path.exists(self.temp_output_video), "Temporary MKV video file was not created.")
        self.assertTrue(os.path.getsize(self.temp_output_video) > 0, "Temporary MKV video file is empty.")

if __name__ == '__main__':
    unittest.main()

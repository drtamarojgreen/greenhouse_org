
import unittest
import subprocess
import os
import time

class TestLogoPipeline(unittest.TestCase):

    def setUp(self):
        """Set up the test environment."""
        self.base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
        self.renders_dir = os.path.join(self.base_dir, 'renders')
        self.images_dir = os.path.join(self.base_dir, 'docs', 'images')
        self.output_video = os.path.join(self.renders_dir, 'logo_animation.mkv')
        self.svg_file = os.path.join(self.images_dir, 'Greenhouse_Logo.svg')

        # Ensure the renders directory exists
        os.makedirs(self.renders_dir, exist_ok=True)

        # Clean up previous test runs
        if os.path.exists(self.output_video):
            os.remove(self.output_video)
        if os.path.exists(self.svg_file):
            os.remove(self.svg_file)

    def test_full_logo_animation_pipeline(self):
        """
        Tests the full pipeline from PNG to SVG to an MKV video.
        """
        # 1. Run the SVG conversion script
        convert_script = os.path.join(self.base_dir, 'scripts', 'blender', 'convert_logo_to_svg.py')
        result = subprocess.run(['python3', convert_script], capture_output=True, text=True)

        self.assertEqual(result.returncode, 0, f"SVG conversion script failed: {result.stderr}")
        self.assertTrue(os.path.exists(self.svg_file), "SVG file was not created.")

        # 2. Run the Blender rendering script
        render_script = os.path.join(self.base_dir, 'scripts', 'blender', 'render_logo_animation.py')

        # Using a timeout to prevent the test from hanging indefinitely
        try:
            result = subprocess.run(
                ['blender', '--background', '--python', render_script],
                capture_output=True, text=True, timeout=300 # 5-minute timeout
            )
        except subprocess.TimeoutExpired:
            self.fail("Blender rendering process timed out.")

        self.assertEqual(result.returncode, 0, f"Blender rendering script failed: {result.stderr}")

        # 3. Verify the output
        self.assertTrue(os.path.exists(self.output_video), "MKV video file was not created.")

        # Check that the file has a non-zero size
        self.assertTrue(os.path.getsize(self.output_video) > 0, "MKV video file is empty.")

    def tearDown(self):
        """Clean up after the test."""
        # Optional: remove generated files after test
        if os.path.exists(self.output_video):
            os.remove(self.output_video)
        if os.path.exists(self.svg_file):
            os.remove(self.svg_file)

if __name__ == '__main__':
    unittest.main()

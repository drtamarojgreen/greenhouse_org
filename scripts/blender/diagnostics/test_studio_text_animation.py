
import unittest
import subprocess
import os
import tempfile

class TestStudioTextAnimation(unittest.TestCase):

    def setUp(self):
        """Set up the test environment using a temporary directory."""
        self.base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
        self.temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp_dir.cleanup)

        self.temp_blend_file = os.path.join(self.temp_dir.name, 'test_animation.blend')

    def test_blend_file_creation(self):
        """
        Tests that the script can successfully generate a .blend file.
        """
        script_path = os.path.join(self.base_dir, 'scripts', 'blender', 'studio_text_animation.py')

        command = [
            'blender', '--background', '--python', script_path, '--',
            '--save-blend', self.temp_blend_file
        ]

        try:
            result = subprocess.run(
                command,
                capture_output=True, text=True, timeout=300
            )
        except FileNotFoundError:
            self.fail("Blender is not installed or not in the system's PATH.")
        except subprocess.TimeoutExpired:
            self.fail("Blender script execution timed out.")

        self.assertEqual(result.returncode, 0, f"Blender script failed with stderr:\n{result.stderr}")

        # Verify that the .blend file was created
        self.assertTrue(os.path.exists(self.temp_blend_file), "Temporary .blend file was not created.")
        self.assertTrue(os.path.getsize(self.temp_blend_file) > 0, "Temporary .blend file is empty.")

if __name__ == '__main__':
    unittest.main()

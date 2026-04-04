import unittest
import os
try:
    import bpy
except ImportError:
    bpy = None

try:
    import config
    from renderer_dialogue import Scene3Renderer
except ImportError:
    try:
        from scripts.blender.movie._3.renderer_dialogue import Scene3Renderer, config
    except ImportError:
        Scene3Renderer = None
        config = None

class TestRendererDialogue(unittest.TestCase):
    def setUp(self):
        if Scene3Renderer:
            self.renderer = Scene3Renderer()
        else:
            self.renderer = None

    def test_output_paths(self):
        # Verify renderer handles local scene directory output
        self.assertTrue(config.OUTPUT_BASE_DIR.endswith("3/renders")) if config else self.skipTest("Config not available")

if __name__ == "__main__":
    unittest.main()

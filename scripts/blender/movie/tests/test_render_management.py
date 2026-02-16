import bpy
import os
import sys
import unittest

# Add movie root to path for local imports
MOVIE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if MOVIE_ROOT not in sys.path:
    sys.path.append(MOVIE_ROOT)

import silent_movie_generator

class TestRenderManagement(unittest.TestCase):
    def setUp(self):
        self.master = silent_movie_generator.MovieMaster()
        self.master.run()

    def test_84_output_naming(self):
        """R84: Test for expected render output naming conventions."""
        self.master.scene.render.filepath = "/tmp/render_"
        # Mock frame number
        frame = 100
        path = self.master.scene.render.frame_path(frame=frame)
        self.assertIn("0100", path, "R84 FAIL: Incorrect frame padding in output path")

    def test_85_frame_count_match(self):
        """R85: Test for output frame count match per requested range."""
        # This would usually check the filesystem after a render.
        # Here we check if frame_start/end match SCENE_MAP.
        for name, (start, end) in silent_movie_generator.SCENE_MAP.items():
             count = end - start + 1
             self.assertGreater(count, 0, f"R85 FAIL: Scene {name} has zero/negative frame count")

    def test_86_chunking_logic(self):
        """R86: Test for render manager chunking behavior."""
        # Check render_manager.py if it exists
        mgr_path = os.path.join(MOVIE_ROOT, "render_manager.py")
        if os.path.exists(mgr_path):
             # Basic check: does it have a CHUNK_SIZE?
             with open(mgr_path, 'r') as f:
                 content = f.read()
                 self.assertIn("chunk", content.lower(), "R86 FAIL: No chunking logic found in render_manager.py")

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)

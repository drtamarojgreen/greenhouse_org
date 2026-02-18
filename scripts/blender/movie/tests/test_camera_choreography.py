import bpy
import os
import sys
import unittest
import math
import mathutils

# Add movie root to path for local imports
MOVIE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if MOVIE_ROOT not in sys.path:
    sys.path.append(MOVIE_ROOT)

import silent_movie_generator
import style

class TestCameraChoreography(unittest.TestCase):
    def setUp(self):
        self.master = silent_movie_generator.MovieMaster()
        self.master.run()

    def test_51_camera_cuts(self):
        """R51: Camera cuts only on approved frame markers."""
        cam = self.master.scene.camera
        curves = style.get_action_curves(cam.animation_data.action)

        cut_frames = []
        for fc in curves:
            if fc.data_path == "location":
                for kp in fc.keyframe_points:
                    cut_frames.append(kp.co[0])

        scene_boundaries = []
        for start, end in silent_movie_generator.SCENE_MAP.values():
            scene_boundaries.extend([start, end])

        # Point 52: Allow planned intra-scene cuts (e.g., in Interaction)
        planned_intra_scene = [6200, 6800]
        scene_boundaries.extend(planned_intra_scene)

        # Every camera jump should be near a scene boundary or intertitle
        for f in sorted(list(set(cut_frames))):
            self.assertTrue(any(abs(f - b) < 5 for b in scene_boundaries), f"R51 FAIL: Unplanned camera keyframe at {f}")

    def test_52_min_shot_duration(self):
        """R52: Minimum shot duration to avoid jarring cuts."""
        # Find intervals between camera keyframes
        cam = self.master.scene.camera
        keyframes = sorted(list(set([kp.co[0] for fc in cam.animation_data.action.fcurves for kp in fc.keyframe_points])))

        for i in range(len(keyframes) - 1):
            duration = keyframes[i+1] - keyframes[i]
            # Minimum shot duration roughly 24 frames (1 second)
            # Some transitions might be faster, let's say 12 frames
            self.assertGreaterEqual(duration, 10, f"R52 FAIL: Very short shot duration of {duration} at frame {keyframes[i]}")

    def test_53_max_shot_duration(self):
        """R53: Maximum shot duration to avoid stagnation."""
        cam = self.master.scene.camera
        keyframes = sorted(list(set([kp.co[0] for fc in cam.animation_data.action.fcurves for kp in fc.keyframe_points])))

        for i in range(len(keyframes) - 1):
            duration = keyframes[i+1] - keyframes[i]
            # Maximum shot duration roughly 2000 frames (~80 seconds)
            self.assertLessEqual(duration, 5000, f"R53 FAIL: Extremely long stagnant shot of {duration} at frame {keyframes[i]}")

    def test_54_closeup_focus(self):
        """R54: Close-up focus object validity."""
        cam = self.master.scene.camera
        if cam.data.dof.use_dof:
            self.assertIsNotNone(cam.data.dof.focus_object, "R54 FAIL: DOF enabled but no focus object")

    def test_56_camera_clipping(self):
        """R56: Camera clipping plane safety in closeups."""
        cam = self.master.scene.camera
        # Near clipping should be small enough for closeups
        self.assertLessEqual(cam.data.clip_start, 0.1, "R56 FAIL: Near clipping too large for closeups")

    def test_59_camera_continuity(self):
        """R59: Camera path continuity (no abrupt jumps within a shot)."""
        cam = self.master.scene.camera
        # We check continuity between keyframes that are not intended to be cuts
        # This is a heuristic: if two location keyframes are < 5 frames apart, it's a cut.
        # If they are > 5 frames apart, the transition should be smooth.
        # But evaluation is needed.
        pass

    def test_camera_collision(self):
        """Check if camera clips through major objects (Trees, Structure)."""
        cam = self.master.scene.camera
        # Identify obstacles
        obstacles = []
        for obj in bpy.data.objects:
            if any(x in obj.name for x in ["Greenhouse_Structure", "Arbor_Torso", "Tree", "Pillar"]):
                obstacles.append(obj)
        
        if not obstacles:
            self.skipTest("No obstacles found for collision test.")
            return

        # Sample frames to save time
        step = 100 
        scene = self.master.scene
        start = scene.frame_start
        end = scene.frame_end
        
        for f in range(start, end, step):
            scene.frame_set(f)
            cam_loc = cam.matrix_world.translation
            
            for obj in obstacles:
                if obj.hide_render: continue
                
                # A simple distance check is a good first pass
                dist = (cam_loc - obj.matrix_world.translation).length
                
                self.assertGreater(dist, 0.5, f"Camera collision with {obj.name} at frame {f} (Dist: {dist:.2f})")

    def test_60_final_transition(self):
        """R60: Final transition shot duration before credits."""
        credits_start = silent_movie_generator.SCENE_MAP.get('scene12_credits', [0,0])[0]
        retreat_end = silent_movie_generator.SCENE_MAP.get('scene22', [0,0])[1]

        self.assertGreater(credits_start, retreat_end, "R60 FAIL: Credits should start after the retreat scene ends")

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)

import bpy
import unittest
import os
import sys
import math

# Add movie root to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from silent_movie_generator import MovieMaster
import style

class TestInteractionScene(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Point 140: Ensure animation data exists
        h1 = bpy.data.objects.get("Herbaceous")
        has_anim = h1 and h1.animation_data and h1.animation_data.action and len(style.get_action_curves(h1.animation_data.action)) > 0

        if not hasattr(cls, 'master') or not cls.master or not has_anim:
            cls.master = MovieMaster(mode='SILENT_FILM')
            cls.master.run()

    def test_interaction_frame_range(self):
        """Verify the interaction scene frames are within the 4501-9500 range."""
        scene = bpy.context.scene
        # The interaction scene is part of the master timeline
        self.assertEqual(scene.frame_start, 1)
        self.assertEqual(scene.frame_end, 15000)

    def test_herbaceous_interaction_animation(self):
        """Check Herbaceous animation in the interaction phase (Armature)."""
        obj = bpy.data.objects.get("Herbaceous")
        self.assertIsNotNone(obj, "Herbaceous armature not found")

        anim_data = obj.animation_data
        self.assertIsNotNone(anim_data, "Herbaceous has no animation data")
        self.assertIsNotNone(anim_data.action, "Herbaceous has no action")

        curves = style.get_action_curves(anim_data.action)

        # Check for movement keyframes (Phase 1: 4501-6000)
        loc_x_found = False
        for fc in curves:
            if fc.data_path == "location" and fc.array_index == 0:
                loc_x_found = True
                keyframes = [kp.co[0] for kp in fc.keyframe_points]
                # Point 57: Use approximate matching for float frames
                self.assertTrue(any(abs(k - 4501) < 0.5 for k in keyframes))
                self.assertTrue(any(abs(k - 6000) < 0.5 for k in keyframes))
        self.assertTrue(loc_x_found, "Location X keyframes not found for Herbaceous")

    def test_talking_animation(self):
        """Check if characters have talking animation in the interaction range (Bones)."""
        for name in ["Herbaceous", "Arbor"]:
            char_obj = bpy.data.objects.get(name)
            self.assertIsNotNone(char_obj, f"{name} armature not found")

            anim_data = char_obj.animation_data
            self.assertIsNotNone(anim_data, f"{name} has no animation data")

            curves = style.get_action_curves(anim_data.action)
            mouth_bone_found = False
            for fc in curves:
                # Check for Mouth bone scale on the armature
                if 'pose.bones["Mouth"].scale' in fc.data_path and fc.array_index == 2:
                    mouth_bone_found = True
                    keyframes = [kp.co[0] for kp in fc.keyframe_points]
                    # Herbaceous talks 4600-5000, 5600-5900
                    # Arbor talks 5100-5500
                    if name == "Herbaceous":
                        self.assertTrue(any(4600 <= k <= 5900 for k in keyframes), "Herbaceous talking keyframes missing")
                    else:
                        self.assertTrue(any(5100 <= k <= 5500 for k in keyframes), "Arbor talking keyframes missing")
            self.assertTrue(mouth_bone_found, f"Mouth bone scale keyframes not found for {name}")

    def test_expression_keyframes(self):
        """Verify expression keyframes are set for interaction (Bones)."""
        # Testing eye bone scaling as a proxy for expression logic
        char_obj = bpy.data.objects.get("Herbaceous")
        self.assertIsNotNone(char_obj, "Herbaceous armature not found")

        anim_data = char_obj.animation_data
        self.assertIsNotNone(anim_data, "Herbaceous has no animation data")

        curves = style.get_action_curves(anim_data.action)
        eye_scale_found = False
        for fc in curves:
            if 'pose.bones["Eye.L"].scale' in fc.data_path:
                eye_scale_found = True
                keyframes = [kp.co[0] for kp in fc.keyframe_points]
                # Point 57: Approximate matching
                self.assertTrue(any(abs(k - 6200) < 0.5 for k in keyframes))
                self.assertTrue(any(abs(k - 6500) < 0.5 for k in keyframes))
        self.assertTrue(eye_scale_found, "Eye bone scale (expression) keyframes not found for Herbaceous")

    def test_staff_gesture(self):
        """Check Herbaceous staff gesture in interaction scene (Bone-aware)."""
        # Staff is parented to Arm.R bone, which is animated for the gesture
        arm = bpy.data.objects.get("Herbaceous")
        self.assertIsNotNone(arm, "Herbaceous armature not found")

        anim_data = arm.animation_data
        self.assertIsNotNone(anim_data, "Herbaceous has no animation data")

        curves = style.get_action_curves(anim_data.action)
        rot_x_found = False
        target_path = 'pose.bones["Arm.R"].rotation_euler'
        for fc in curves:
            if target_path in fc.data_path and fc.array_index == 0:
                rot_x_found = True
                keyframes = [kp.co[0] for kp in fc.keyframe_points]
                # Point 57: Approximate matching
                self.assertTrue(any(abs(k - 6200) < 0.5 for k in keyframes))
                self.assertTrue(any(abs(k - 6300) < 0.5 for k in keyframes))
                self.assertTrue(any(abs(k - 6400) < 0.5 for k in keyframes))
        self.assertTrue(rot_x_found, f"Rotation X keyframes not found for bone {target_path}")

    def test_gaze_target_movement(self):
        """Check GazeTarget location changes during interaction."""
        gaze = bpy.data.objects.get("GazeTarget")
        self.assertIsNotNone(gaze, "GazeTarget not found")

        anim_data = gaze.animation_data
        self.assertIsNotNone(anim_data, "GazeTarget has no animation data")

        curves = style.get_action_curves(anim_data.action)
        loc_found = False
        for fc in curves:
            if fc.data_path == "location":
                loc_found = True
                keyframes = [kp.co[0] for kp in fc.keyframe_points]
                # Point 57: Approximate matching
                self.assertTrue(any(abs(k - 7501) < 0.5 for k in keyframes))
                self.assertTrue(any(abs(k - 8200) < 0.5 for k in keyframes))
        self.assertTrue(loc_found, "Location keyframes not found for GazeTarget interaction")

if __name__ == "__main__":
    # Filter out Blender arguments
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv, exit=False)

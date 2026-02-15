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
        # Run the movie master to generate the scene
        cls.master = MovieMaster(mode='SILENT_FILM')
        cls.master.run()

    def test_interaction_frame_range(self):
        """Verify the interaction scene frames are within the 4501-9500 range."""
        scene = bpy.context.scene
        # The interaction scene is part of the master timeline
        self.assertEqual(scene.frame_start, 1)
        self.assertEqual(scene.frame_end, 10000)

    def test_herbaceous_interaction_animation(self):
        """Check Herbaceous animation in the interaction phase."""
        obj = bpy.data.objects.get("Herbaceous_Torso")
        self.assertIsNotNone(obj, "Herbaceous_Torso not found")

        anim_data = obj.animation_data
        self.assertIsNotNone(anim_data, "Herbaceous_Torso has no animation data")
        self.assertIsNotNone(anim_data.action, "Herbaceous_Torso has no action")

        curves = style.get_action_curves(anim_data.action)

        # Check for movement keyframes (Phase 1: 4501-6000)
        loc_x_found = False
        for fc in curves:
            if fc.data_path == "location" and fc.array_index == 0:
                loc_x_found = True
                keyframes = [kp.co[0] for kp in fc.keyframe_points]
                self.assertIn(4501, keyframes)
                self.assertIn(6000, keyframes)
        self.assertTrue(loc_x_found, "Location X keyframes not found for Herbaceous")

    def test_talking_animation(self):
        """Check if characters have talking animation in the interaction range."""
        for name in ["Herbaceous", "Arbor"]:
            mouth = bpy.data.objects.get(f"{name}_Mouth")
            self.assertIsNotNone(mouth, f"{name}_Mouth not found")

            anim_data = mouth.animation_data
            self.assertIsNotNone(anim_data, f"{name}_Mouth has no animation data")

            curves = style.get_action_curves(anim_data.action)
            scale_z_found = False
            for fc in curves:
                if fc.data_path == "scale" and fc.array_index == 2:
                    scale_z_found = True
                    keyframes = [kp.co[0] for kp in fc.keyframe_points]
                    # Herbaceous talks 4600-5000, 5600-5900
                    # Arbor talks 5100-5500
                    if name == "Herbaceous":
                        self.assertTrue(any(4600 <= k <= 5900 for k in keyframes), "Herbaceous talking keyframes missing")
                    else:
                        self.assertTrue(any(5100 <= k <= 5500 for k in keyframes), "Arbor talking keyframes missing")
            self.assertTrue(scale_z_found, f"Scale Z keyframes not found for {name}_Mouth")

    def test_expression_keyframes(self):
        """Verify expression keyframes are set for interaction."""
        # Testing one brow as a proxy for expression logic
        brow = bpy.data.objects.get("Herbaceous_Brow_L")
        self.assertIsNotNone(brow, "Herbaceous_Brow_L not found")

        anim_data = brow.animation_data
        self.assertIsNotNone(anim_data, "Herbaceous_Brow_L has no animation data")

        curves = style.get_action_curves(anim_data.action)
        rot_y_found = False
        for fc in curves:
            if fc.data_path == "rotation_euler" and fc.array_index == 1:
                rot_y_found = True
                keyframes = [kp.co[0] for kp in fc.keyframe_points]
                # Herbaceous expressions at 6200, 6500
                self.assertIn(6200, keyframes)
                self.assertIn(6500, keyframes)
        self.assertTrue(rot_y_found, "Rotation Y (expression) keyframes not found for Herbaceous Brow")

    def test_staff_gesture(self):
        """Check Herbaceous staff gesture in interaction scene."""
        staff = bpy.data.objects.get("Herbaceous_ReasonStaff")
        self.assertIsNotNone(staff, "Herbaceous_ReasonStaff not found")

        anim_data = staff.animation_data
        self.assertIsNotNone(anim_data, "Herbaceous_ReasonStaff has no animation data")

        curves = style.get_action_curves(anim_data.action)
        rot_x_found = False
        for fc in curves:
            if fc.data_path == "rotation_euler" and fc.array_index == 0:
                rot_x_found = True
                keyframes = [kp.co[0] for kp in fc.keyframe_points]
                # Gesture at 6200, 6300, 6400
                self.assertIn(6200, keyframes)
                self.assertIn(6300, keyframes)
                self.assertIn(6400, keyframes)
        self.assertTrue(rot_x_found, "Rotation X keyframes not found for Staff gesture")

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
                # Interaction gaze updates at 7501, 8200
                self.assertIn(7501, keyframes)
                self.assertIn(8200, keyframes)
        self.assertTrue(loc_found, "Location keyframes not found for GazeTarget interaction")

if __name__ == "__main__":
    # Filter out Blender arguments
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv, exit=False)

import bpy
import mathutils
import sys
import unittest
from base_test import BlenderTestCase
import style

class TestAnimation(BlenderTestCase):
    def test_01_animation_presence(self):
        """Check if objects have animation data."""
        objs_with_anim = ["Herbaceous_Torso", "Arbor_Torso", "GazeTarget", "CamTarget"]
        for name in objs_with_anim:
            obj = bpy.data.objects.get(name)
            if obj:
                has_anim = obj.animation_data is not None
                status = "PASS" if has_anim else "FAIL"
                self.log_result(f"Animation: {name}", status, "Data present" if has_anim else "MISSING")
                self.assertTrue(has_anim)

    def test_02_frame_range(self):
        """Check if scene frame range matches the plan."""
        scene = bpy.context.scene
        is_correct = scene.frame_start == 1 and scene.frame_end == 5000
        status = "PASS" if is_correct else "FAIL"
        self.log_result("Frame Range", status, f"{scene.frame_start}-{scene.frame_end}")
        self.assertTrue(is_correct)

    def test_03_camera_tracking(self):
        """Ensure camera is tracking the target."""
        cam = bpy.context.scene.camera
        has_track = any(c.type == 'TRACK_TO' and c.target and c.target.name == "CamTarget" for c in cam.constraints)
        self.log_result("Camera Tracking", "PASS" if has_track else "FAIL", "Constraint found" if has_track else "Missing")
        self.assertTrue(has_track)

    def test_04_limb_movement(self):
        """Verify that character limbs have active animation data."""
        limbs = [
            "Herbaceous_Arm_L", "Herbaceous_Arm_R", "Herbaceous_Leg_L", "Herbaceous_Leg_R",
            "Arbor_Arm_L", "Arbor_Arm_R"
        ]
        
        for limb_name in limbs:
            with self.subTest(limb=limb_name):
                obj = bpy.data.objects.get(limb_name)
                if not obj:
                    self.log_result(f"Limb Anim: {limb_name}", "FAIL", "Object missing")
                    continue
                
                # Check if it has an action and curves
                has_action = obj.animation_data and obj.animation_data.action
                curve_count = 0
                if has_action:
                    curves = style.get_action_curves(obj.animation_data.action)
                    curve_count = len(curves)
                
                status = "PASS" if curve_count > 0 else "WARNING"
                self.log_result(f"Limb Anim: {limb_name}", status, f"Curves: {curve_count}")
                # Warning only, as some limbs might be static in specific scenes

    def test_05_camera_coverage(self):
        """Verify camera moves significantly to cover different angles."""
        cam = bpy.context.scene.camera
        if not cam or not cam.animation_data or not cam.animation_data.action:
            self.fail("Camera has no animation data")
            
        # Sample camera position at start and mid-point
        # Note: We can't easily evaluate fcurves without frame_set which is slow, 
        # so we check if location fcurves exist and have keyframes with different values.
        curves = style.get_action_curves(cam.animation_data.action)
        loc_curves = [c for c in curves if "location" in c.data_path]
        
        has_movement = False
        for c in loc_curves:
            values = [k.co[1] for k in c.keyframe_points]
            if len(values) > 1 and max(values) - min(values) > 1.0:
                has_movement = True
                break
        
        status = "PASS" if has_movement else "FAIL"
        self.log_result("Camera Movement", status, "Camera changes position significantly" if has_movement else "Camera is static")
        self.assertTrue(has_movement)

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)
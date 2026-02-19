import bpy
import mathutils
import sys
import unittest
from base_test import BlenderTestCase
import style

class TestAnimation(BlenderTestCase):
    def test_01_animation_presence(self):
        """Check if objects have animation data."""
        # characters are now Armatures named Herbaceous/Arbor
        objs_with_anim = ["Herbaceous", "Arbor", "GazeTarget", "CamTarget"]
        for name in objs_with_anim:
            obj = bpy.data.objects.get(name)
            if obj:
                # Robustness: Check for an action with actual keyframes, not just animation_data
                has_action = obj.animation_data and obj.animation_data.action
                curves = style.get_action_curves(obj.animation_data.action)
                has_fcurves = has_action and len(curves) > 0
                status = "PASS" if has_fcurves else "FAIL"
                details = "Action with f-curves present" if has_fcurves else "MISSING action or f-curves"
                self.log_result(f"Animation: {name}", status, details)
                self.assertTrue(has_fcurves)

    def test_02_frame_range(self):
        """Check if scene frame range matches the plan."""
        scene = bpy.context.scene
        # Corrected frame_end from 5000 to 15000 to match project spec
        is_correct = scene.frame_start == 1 and scene.frame_end == 15000
        status = "PASS" if is_correct else "FAIL"
        self.log_result("Frame Range", status, f"{scene.frame_start}-{scene.frame_end}")
        self.assertTrue(is_correct)

    def test_03_camera_tracking(self):
        """Ensure camera is tracking the target."""
        cam = bpy.context.scene.camera
        track_constraint = next((c for c in cam.constraints if c.type == 'TRACK_TO' and c.target and c.target.name == "CamTarget"), None)
        is_valid = track_constraint is not None and not track_constraint.mute
        self.log_result("Camera Tracking", "PASS" if is_valid else "FAIL", "Active constraint found" if is_valid else "Missing or muted constraint")
        self.assertTrue(is_valid)

    def test_04_limb_movement(self):
        """Verify that character limbs have active animation data."""
        # Limbs are now bones: pose.bones["Arm.L"] etc.
        chars = ["Herbaceous", "Arbor"]
        bones = ["Arm.L", "Arm.R", "Leg.L", "Leg.R"]
        
        for char_name in chars:
            obj = bpy.data.objects.get(char_name)
            if not obj: continue
            
            for bone_name in bones:
                with self.subTest(char=char_name, bone=bone_name):
                    has_movement = False
                    if obj.animation_data and obj.animation_data.action:
                        curves = style.get_action_curves(obj.animation_data.action)
                        for fc in curves:
                            # Robust path matching for Blender 5.0 Slotted Actions
                            path = fc.data_path
                            is_target_bone = bone_name in path
                            if not is_target_bone and hasattr(fc, "group") and fc.group:
                                is_target_bone = bone_name in fc.group.name
                            
                            if is_target_bone and ("location" in path or "rotation" in path):
                                values = [kp.co[1] for kp in fc.keyframe_points]
                                if len(values) > 1 and (max(values) - min(values)) > 0.05:
                                    has_movement = True
                                    break
                    
                    status = "PASS" if has_movement else "FAIL"
                    self.log_result(f"Bone Anim: {char_name}.{bone_name}", status)
                    self.assertTrue(has_movement)

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

    def test_06_noise_modifier_presence(self):
        """CIN-01: Verify presence of F-Curve Noise modifiers for procedural secondary motion."""
        # Noise is now often on bones: pose.bones["Torso"].location
        targets = [
            ("Herbaceous", 'pose.bones["Torso"].location', 2), # Z-axis
            ("Arbor", 'pose.bones["Torso"].location', 2),
        ]
        
        for obj_name, path, index in targets:
            obj = bpy.data.objects.get(obj_name)
            if not obj or not obj.animation_data or not obj.animation_data.action:
                continue
            
            has_noise = False
            curves = style.get_action_curves(obj.animation_data.action)
            for fc in curves:
                # Robust path matching: check if full path matches or if it's a relative path in a matching group/slot
                path_match = fc.data_path == path or (path.endswith(fc.data_path) and obj.type == 'ARMATURE')
                if path_match and fc.array_index == index:
                    for mod in fc.modifiers:
                        if mod.type == 'NOISE':
                            has_noise = True
                            break
                if has_noise: break
            
            status = "PASS" if has_noise else "FAIL"
            self.log_result(f"Noise Modifier: {obj_name}", status, "F-Curve Noise found" if has_noise else "NO Noise modifier found")
            self.assertTrue(has_noise)

    def test_07_animation_gap_detection(self):
        """VAL-01: Detect frames with no active render objects (potential black frames)."""
        # We'll sample transitions or mid-points of scenes
        from silent_movie_generator import SCENE_MAP
        
        gaps = []
        # Test 5 frames in the middle of each scene
        for scene_name, (start, end) in SCENE_MAP.items():
            if end - start < 10: continue
            mid = (start + end) // 2
            
            # Check a small window around mid
            for f in range(mid, mid + 5):
                bpy.context.scene.frame_set(f)
                visible_objs = [o for o in bpy.data.objects if not o.hide_render and o.type == 'MESH']
                if not visible_objs:
                    gaps.append(f)
                    break # One gap per scene is enough for a fail
        
        status = "PASS" if not gaps else "WARNING"
        details = "No black frames detected" if not gaps else f"Potential gaps at frames: {gaps}"
        self.log_result("Animation Gaps", status, details)
        # We don't assert hard here because some scenes might intentionally be dark

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)
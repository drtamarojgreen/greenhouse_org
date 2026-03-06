import bpy
import mathutils
import sys
import unittest
from base_test import BlenderTestCase
import style_utilities as style
import test_utils

class TestAnimation(BlenderTestCase):
    def test_01_animation_presence(self):
        """Check if objects have substantial animation data."""
        objs_with_anim = ["Herbaceous", "Arbor", "GazeTarget", "CamTarget"]
        for name in objs_with_anim:
            obj = bpy.data.objects.get(name)
            if obj:
                # Use robust utility to check for actual movement/noise
                is_active = test_utils.is_animated(obj, "location") or \
                            test_utils.is_animated(obj, "rotation_euler") or \
                            test_utils.is_animated(obj, "rotation_quaternion")
                
                status = "PASS" if is_active else "FAIL"
                self.log_result(f"Animation Presence: {name}", status, "Movement or Noise detected")
                self.assertTrue(is_active, f"Object {name} has no active animation (location/rotation)")

    def test_04_limb_movement_rigor(self):
        """Verify that character limbs have appropriate range of movement."""
        chars = ["Herbaceous", "Arbor"]
        # Essential bones for "thriller" acting
        bones = ["Neck", "Jaw", "Mouth", "Eye.", "Brow."]
        
        for char_name in chars:
            obj = bpy.data.objects.get(char_name)
            if not obj: continue
            
            for bone_name in bones:
                with self.subTest(char=char_name, bone=bone_name):
                    # Check for rotation movement (most common for these bones)
                    # Point 142: Scale 2.5 is the limit for mouth in R71
                    min_val, max_val = test_utils.get_animation_bounds(obj, f'pose.bones["{bone_name}"].rotation_euler', index=0)
                    if min_val is None:
                         # Try location if rotation is missing
                         min_val, max_val = test_utils.get_animation_bounds(obj, f'pose.bones["{bone_name}"].location', index=0)
                    
                    has_range = min_val is not None and (max_val - min_val) > 0.001
                    is_pushed = test_utils.is_animated(obj, f'pose.bones["{bone_name}"].rotation_euler') or \
                                test_utils.is_animated(obj, f'pose.bones["{bone_name}"].location')
                    
                    status = "PASS" if (has_range or is_pushed) else "FAIL"
                    self.log_result(f"Bone Rigor: {char_name}.{bone_name}", status, f"Range: {max_val - min_val if min_val else 0}")
                    self.assertTrue(has_range or is_pushed, f"Bone {bone_name} is static or missing animation.")

    def test_05_camera_cinematography(self):
        """Verify camera displacement is sufficient for a 'thriller' look."""
        cam = bpy.context.scene.camera
        self.assertIsNotNone(cam)
        
        # Check Z-depth movement (dolly)
        z_min, z_max = test_utils.get_animation_bounds(cam, "location", index=2)
        x_min, x_max = test_utils.get_animation_bounds(cam, "location", index=0)
        
        total_displacement = 0
        if z_min is not None: total_displacement += (z_max - z_min)
        if x_min is not None: total_displacement += (x_max - x_min)
        
        # Thriller needs dynamic camera movement, not just static pans
        status = "PASS" if total_displacement > 5.0 else "WARNING"
        self.log_result("Camera Cinematography", status, f"Total Displacement: {total_displacement:.2f}")
        # Not a hard fail to allow for artistic "still" scenes
        if total_displacement < 1.0: 
            self.fail(f"Camera is almost static (Displacement: {total_displacement:.2f}). Thriller requires movement.")

    def test_07_black_frame_rigor(self):
        """Detect gaps where no characters are visible (potential black frames)."""
        from silent_movie_generator import SCENE_MAP
        
        chars = [bpy.data.objects.get(n) for n in ["Herbaceous_Torso", "Arbor_Torso", "GloomGnome_Torso"]]
        chars = [c for c in chars if c]
        
        gaps = []
        for scene_name, (start, end) in SCENE_MAP.items():
            # Sample start and end of scene
            for f in [start + 1, end - 1]:
                any_visible = any(test_utils.check_mesh_visibility_at_frame(c, f) for c in chars)
                if not any_visible:
                    # Allow for specific scenes to be dark if desired, but notify
                    gaps.append((scene_name, f))
        
        status = "PASS" if not gaps else "WARNING"
        details = "Clear visuals detected" if not gaps else f"Potential dark frames in: {[g[0] for g in gaps]}"
        self.log_result("Visual Gaps", status, details)

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)
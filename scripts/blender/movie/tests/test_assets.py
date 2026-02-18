import bpy
import sys
import os
import unittest
from base_test import BlenderTestCase

# Ensure style is available
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import style

class TestAssets(BlenderTestCase):
    def test_01_assets_exist(self):
        """Check if all major characters and structures are in the scene."""
        required_objs = ["Herbaceous_Torso", "Arbor_Torso", "GloomGnome_Torso", "ExpressionistFloor", "CamTarget", "GazeTarget"]
        for obj_name in required_objs:
            with self.subTest(obj=obj_name):
                exists = obj_name in bpy.data.objects
                status = "PASS" if exists else "FAIL"
                self.log_result(f"Asset: {obj_name}", status, "Found" if exists else "MISSING")
                self.assertTrue(exists)

    def test_02_detailed_hierarchy(self):
        """Verify existence of specific character body parts."""
        chars = {
            "Herbaceous": ["Head", "Arm_L", "Arm_R", "Leg_L", "Leg_R", "Eye_L", "Eye_R", "Brow_L", "Brow_R", "Pupil_L", "Pupil_R"],
            "Arbor": ["Head", "Arm_L", "Arm_R", "Leg_L", "Leg_R", "Eye_L", "Eye_R", "Brow_L", "Brow_R", "Pupil_L", "Pupil_R"],
            "GloomGnome": ["Hat", "Beard", "Cloak", "Eye_L", "Eye_R"]
        }
        
        for char_name, parts in chars.items():
            for part in parts:
                full_name = f"{char_name}_{part}"
                with self.subTest(part=full_name):
                    obj = bpy.data.objects.get(full_name)
                    # Robustness: Check for existence AND correct parenting to the character's main body/head
                    is_valid = False
                    if obj and obj.parent:
                        # Walk up the hierarchy to find the main torso
                        p = obj.parent
                        while p:
                            if f"{char_name}_Torso" in p.name:
                                is_valid = True
                                break
                            p = p.parent
                    status = "PASS" if is_valid else "FAIL"
                    self.log_result(f"Part: {full_name}", status, "Found and correctly parented" if is_valid else "MISSING or not parented to character torso")
                    self.assertTrue(is_valid, f"Character part {full_name} is missing or not parented correctly")

    def test_03_visibility_check(self):
        """Check if major assets are ever visible during the render range."""
        required_objs = ["Herbaceous_Torso", "Arbor_Torso", "GloomGnome_Torso", "BrainGroup", "NeuronGroup"]
        
        for obj_name in required_objs:
            obj = bpy.data.objects.get(obj_name)
            if not obj: continue
            
            with self.subTest(obj=obj_name):
                # Check default state
                is_visible = not obj.hide_render
                
                # Check animation data if hidden by default
                if not is_visible and obj.animation_data and obj.animation_data.action:
                    for fcurve in style.get_action_curves(obj.animation_data.action):
                        if "hide_render" in fcurve.data_path:
                            # Check keyframes for any 'False' (0.0) value
                            for kp in fcurve.keyframe_points:
                                if kp.co[1] < 0.5: # 0.0 is visible
                                    is_visible = True
                                    break
                
                status = "PASS" if is_visible else "WARNING"
                details = "Visible in render" if is_visible else "HIDDEN for entire render"
                self.log_result(f"Visibility: {obj_name}", status, details)

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)
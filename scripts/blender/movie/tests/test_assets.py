import bpy
import sys
import os
import unittest
# Add current directory to path to find base_test
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from base_test import BlenderTestCase


# Ensure style is available
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import style

class TestAssets(BlenderTestCase):
    def test_01_assets_exist(self):
        """Check if all major characters and structures are in the scene."""
        # Updated for Single Mesh System
        required_objs = ["Herbaceous_Mesh", "Arbor_Mesh", "GloomGnome_Torso", "Exterior_Garden_Main", "Greenhouse_Main", "CamTarget"]
        for obj_name in required_objs:
            with self.subTest(obj=obj_name):
                exists = obj_name in bpy.data.objects
                status = "PASS" if exists else "FAIL"
                self.log_result(f"Asset: {obj_name}", status, "Found" if exists else "MISSING")
                self.assertTrue(exists)

    def test_02_detailed_hierarchy(self):
        """Verify existence of character Armatures and Meshes."""
        chars = ["Herbaceous", "Arbor"]
        for char_name in chars:
            # Check Armature
            arm_name = f"{char_name}" # Armature is named after the character
            with self.subTest(part=arm_name):
                obj = bpy.data.objects.get(arm_name)
                is_valid = obj and obj.type == 'ARMATURE'
                status = "PASS" if is_valid else "FAIL"
                self.log_result(f"Armature: {arm_name}", status, "Found" if is_valid else "MISSING")
                self.assertTrue(is_valid)

            # Check Mesh Parenting
            mesh_name = f"{char_name}_Mesh"
            with self.subTest(part=mesh_name):
                obj = bpy.data.objects.get(mesh_name)
                is_valid = False
                if obj and obj.parent and obj.parent.name == arm_name:
                    is_valid = True
                status = "PASS" if is_valid else "FAIL"
                self.log_result(f"Mesh: {mesh_name}", status, "Parented to Armature" if is_valid else "MISSING or Unparented")
                self.assertTrue(is_valid)
        
        # Gnome might still be multi-part or partially merged? 
        # Checking Gnome Torso as base
        gnome = bpy.data.objects.get("GloomGnome_Torso")
        self.assertTrue(gnome, "GloomGnome_Torso missing")

    def test_03_visibility_check(self):
        """Check if major assets are ever visible during the render range."""
        # Updated for Single Mesh System
        required_objs = ["Herbaceous_Mesh", "Arbor_Mesh", "GloomGnome_Torso", "BrainGroup", "NeuronGroup"]
        
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
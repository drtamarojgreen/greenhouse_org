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
        objs = {
            "Herbaceous_Torso": "Herbaceous",
            "Arbor_Torso": "Arbor",
            "GloomGnome_Mesh": "GloomGnome",
            "Exterior_Garden_Main": None,
            "Greenhouse_Main": None,
            "CamTarget": None,
            "GazeTarget": None
        }
        for obj_name in objs:
            with self.subTest(obj=obj_name):
                exists = obj_name in bpy.data.objects
                status = "PASS" if exists else "FAIL"
                details = "Found" if exists else "NOT FOUND"
                self.log_result(f"Asset: {obj_name}", status, details)
                self.assertTrue(exists)

    def test_02_detailed_hierarchy(self):
        """Verify existence of character Armatures and Meshes."""
        parts = {
            "Herbaceous": "ARMATURE",
            "Herbaceous_Torso": "MESH",
            "Arbor": "ARMATURE",
            "Arbor_Torso": "MESH"
        }
        for name, otype in parts.items():
            with self.subTest(part=name):
                obj = bpy.data.objects.get(name)
                is_valid = obj and obj.type == otype
                
                # For meshes, check parenting
                if is_valid and otype == "MESH" and "_" in name:
                    parent_name = name.split("_")[0]
                    is_valid = obj.parent and obj.parent.name == parent_name

                status = "PASS" if is_valid else "FAIL"
                details = f"Found and correct type" if is_valid else "MISSING or Unparented"
                if otype == "MESH" and is_valid: details = "Parented to Armature"
                self.log_result(f"{otype.capitalize()}: {name}", status, details)
                self.assertTrue(is_valid)
        
    def test_03_visibility_check(self):
        """Check if major assets are ever visible during the render range."""
        # Updated for Single Mesh System
        required_objs = ["Herbaceous_Torso", "Arbor_Torso", "GloomGnome_Mesh", "BrainGroup", "NeuronGroup"]
        
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
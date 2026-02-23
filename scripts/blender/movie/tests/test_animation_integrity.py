import bpy
import unittest
import os
import sys

# Add movie root to path for imports from parent directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tests.base_test import BlenderTestCase
from silent_movie_generator import MovieMaster
import style_utilities as style
from bpy_extras import anim_utils

class TestAnimationIntegrity(BlenderTestCase):

    @classmethod
    def setUpClass(cls):
        if not cls._master_initialized:
            cls.master = MovieMaster(mode='SILENT_FILM')
            cls.master.setup_engine()
            cls.master.load_assets()
            cls._master_initialized = True

    def test_01_character_prerequisites(self):
        """
        Fly-on-the-wall: Check if the character rig is valid before animation.
        """
        h1 = self.master.h1
        self.assertIsNotNone(h1, "Master object does not have 'h1' (Herbaceous)")
        self.assertEqual(h1.type, 'ARMATURE', "Herbaceous is not an Armature")
        self.assertIn("Torso", h1.pose.bones, "Torso bone not in pose bones")
        self.log_result("Character Prerequisites", "PASS", "Herbaceous rig is valid")

    def test_02_direct_keyframe_insertion(self):
        """
        Fly-on-the-wall: Can a keyframe be inserted and detected at all?
        """
        h1 = self.master.h1
        self.assertIsNotNone(h1, "Herbaceous character not found")

        if not h1.animation_data: h1.animation_data_create()
        if not h1.animation_data.action:
            action = bpy.data.actions.new(name="IntegrityTestAction")
            h1.animation_data.action = action
        
        torso_bone = h1.pose.bones.get("Torso")
        self.assertIsNotNone(torso_bone, "Torso bone not found")
        
        torso_bone.location[0] = 5.0
        h1.keyframe_insert(data_path='pose.bones["Torso"].location', index=0, frame=42)
        
        curves = style.get_action_curves(h1.animation_data.action, obj=h1)
        torso_loc_x_curve = [fc for fc in curves if 'pose.bones["Torso"].location' in fc.data_path and fc.array_index == 0]
        
        self.assertEqual(len(torso_loc_x_curve), 1, "Direct keyframe_insert call failed to create an F-curve")
        self.log_result("Direct Keyframe Insertion", "PASS", "F-curve created and detected successfully")

    def test_03_baseline_logic_step_by_step(self):
        """
        Fly-on-the-wall: Replicate the 'Baseline acting' logic to see where it fails.
        """
        h1 = self.master.h1
        self.assertIsNotNone(h1, "Herbaceous character not found")

        if not h1.animation_data: h1.animation_data_create()
        if not h1.animation_data.action:
             h1.animation_data.action = bpy.data.actions.new(name=f"Anim_{h1.name}")
        self.assertIsNotNone(h1.animation_data.action, "Action could not be created for Herbaceous")

        bone_name = "Arm.L"
        bone = h1.pose.bones.get(bone_name)
        self.assertIsNotNone(bone, f"Bone '{bone_name}' not found")
        
        bone.rotation_euler[0] += 0.01
        h1.keyframe_insert(data_path=f'pose.bones["{bone_name}"].rotation_euler', index=0, frame=1)
        
        bone.rotation_euler[0] -= 0.02
        h1.keyframe_insert(data_path=f'pose.bones["{bone_name}"].rotation_euler', index=0, frame=7500)

        curves = style.get_action_curves(h1.animation_data.action, obj=h1)
        self.assertGreater(len(curves), 0, "No F-curves found after replicating baseline logic.")
        
        arm_rot_curve = [fc for fc in curves if f'pose.bones["{bone_name}"].rotation_euler' in fc.data_path]
        
        self.assertEqual(len(arm_rot_curve), 1, "Replicated baseline logic did not create the expected rotation F-curve.")
        self.log_result("Baseline Logic Step-by-Step", "PASS", "Keyframes created successfully.")

    def test_04_debug_get_action_curves(self):
        """
        Fly-on-the-wall: Manually inspect the action structure to debug get_action_curves.
        """
        h1 = self.master.h1
        self.assertIsNotNone(h1, "Herbaceous character not found")

        if not h1.animation_data: h1.animation_data_create()
        if not h1.animation_data.action:
            action = bpy.data.actions.new(name="DebugAction")
            h1.animation_data.action = action
        
        action = h1.animation_data.action
        
        # Insert a keyframe to create some data
        bone_name = "Neck"
        bone = h1.pose.bones.get(bone_name)
        self.assertIsNotNone(bone, f"Bone '{bone_name}' not found")
        bone.location[2] = 1.0
        h1.keyframe_insert(data_path=f'pose.bones["{bone_name}"].location', index=2, frame=100)

        # --- Manual Inspection ---
        print("\n--- MANUAL ACTION INSPECTION (5.0 Channel Bag) ---")
        manual_curves_found = 0
        
        slot = h1.animation_data.action_slot
        if slot:
            try:
                bag = anim_utils.action_get_channelbag_for_slot(action, slot)
                if bag:
                    print(f"Found {len(bag.fcurves)} fcurves in channel bag.")
                    for fc in bag.fcurves:
                        print(f"  - F-Curve: {fc.data_path}, index {fc.array_index}")
                        manual_curves_found += 1
            except: pass
        
        print("--- END MANUAL INSPECTION ---")
        
        # Now, let's see what the utility function finds
        style_curves = style.get_action_curves(action, obj=h1)
        
        self.assertGreater(manual_curves_found, 0, "Manual inspection failed to find any created fcurves.")
        self.log_result("Manual Inspection", "PASS", f"Manually found {manual_curves_found} fcurve(s).")
        
        self.assertGreater(len(style_curves), 0, "style.get_action_curves() returned an empty list.")
        self.log_result("get_action_curves", "PASS", f"Utility found {len(style_curves)} curve(s).")
        
        self.assertEqual(len(style_curves), manual_curves_found, "Mismatch between manual inspection and get_action_curves utility.")

if __name__ == '__main__':
    unittest.main(argv=sys.argv[sys.argv.index("--") + 1:])

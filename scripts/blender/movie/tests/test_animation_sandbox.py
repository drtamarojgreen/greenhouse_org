import bpy
import unittest
import os
import sys

# Add movie root to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import style_utilities as style
from bpy_extras import anim_utils

print("EP_DEBUG: test_animation_sandbox.py module loaded (version 7 - CHANNEL BAGS)")

class TestAnimationSandbox(unittest.TestCase):

    def setUp(self):
        bpy.ops.wm.read_factory_settings(use_empty=True)

    def test_animation_in_new_blend_file(self):
        # 1. Create a simple armature
        bpy.ops.object.armature_add(enter_editmode=True)
        armature_obj = bpy.context.object
        armature_obj.name = "TestArmature"
        bone = armature_obj.data.edit_bones[0]
        bone.name = "TestBone"
        bpy.ops.object.mode_set(mode='OBJECT')

        # 2. Setup Action
        if not armature_obj.animation_data: armature_obj.animation_data_create()
        action = armature_obj.animation_data.action = bpy.data.actions.new(name="SandboxAction")
        
        # Ensure a layer exists for 5.0 Slotted Actions
        if hasattr(action, "layers"): action.layers.new(name="Main Layer")

        # 3. Create F-curve using modern API
        # Ref obj is armature_obj, data_path is for the bone
        dp = 'pose.bones["TestBone"].location'
        fc = style.get_or_create_fcurve(action, dp, index=0, ref_obj=armature_obj)
        self.assertIsNotNone(fc, "get_or_create_fcurve returned None")
        
        fc.keyframe_points.insert(frame=10, value=1.5)
        
        print("\n" + "="*50)
        print("CHANNEL BAG DISCOVERY TEST")
        print("="*50)
        
        anim_data = armature_obj.animation_data
        slot = anim_data.action_slot
        
        print(f"Action: {action.name}")
        print(f"Active Slot: {slot}")
        
        # Manual Discovery using Channel Bags
        fcurves_found_manually = []
        try:
            bag = anim_utils.action_get_channelbag_for_slot(action, slot)
            if bag:
                print(f"Found Channel Bag for slot. F-Curves: {len(bag.fcurves)}")
                for i, f in enumerate(bag.fcurves):
                    print(f"  [{i}] {f.data_path}")
                    fcurves_found_manually.append(f)
            else:
                print("FAILED: No Channel Bag found for slot.")
        except Exception as e:
            print(f"ERROR using anim_utils: {e}")

        # Use style utility
        curves_util = style.get_action_curves(action, obj=armature_obj)
        print(f"TOTAL FOUND BY style.get_action_curves: {len(curves_util)}")
        for i, c in enumerate(curves_util):
             print(f"  [{i}] {c.data_path}")

        self.assertGreater(len(fcurves_found_manually), 0, "No F-curves found in channel bag.")
        self.assertEqual(len(curves_util), len(fcurves_found_manually), "Style utility mismatch.")
        
        print("\nSANDBOX TEST PASSED: Channel Bag approach is functional.")

if __name__ == '__main__':
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)

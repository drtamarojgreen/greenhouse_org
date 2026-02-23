import bpy
import unittest
import os
import sys

# Add movie root to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import style_utilities as style

print("EP_DEBUG: test_animation_sandbox.py module loaded (version 1)")

class TestAnimationSandbox(unittest.TestCase):

    def setUp(self):
        """
        Create a completely clean sandbox environment for each test.
        """
        bpy.ops.wm.read_factory_settings(use_empty=True)

    def test_animation_in_new_blend_file(self):
        """
        EP Sandbox Test: Deep inspection of the Action structure after
        a keyframe is inserted.
        """
        # 1. Create a simple armature and cube
        bpy.ops.object.armature_add(enter_editmode=True)
        armature_obj = bpy.context.object
        armature_obj.name = "TestArmature"
        bone = armature_obj.data.edit_bones[0]
        bone.name = "TestBone"
        bpy.ops.object.mode_set(mode='OBJECT')
        cube_obj = bpy.data.objects.new("TestCube", bpy.data.meshes.new("Cube"))
        bpy.context.scene.collection.objects.link(cube_obj)
        cube_obj.parent = armature_obj
        cube_obj.parent_type = 'BONE'
        cube_obj.parent_bone = "TestBone"

        # 2. Attempt to insert a keyframe on the pose bone
        pose_bone = armature_obj.pose.bones["TestBone"]
        
        if not armature_obj.animation_data: armature_obj.animation_data_create()
        action = armature_obj.animation_data.action
        if not action:
            action = bpy.data.actions.new(name="SandboxAction")
            armature_obj.animation_data.action = action
        
        # This is the modern way to create an f-curve
        fc = style.get_or_create_fcurve(action, 'pose.bones["TestBone"].rotation_euler', 0, ref_obj=armature_obj)
        self.assertIsNotNone(fc, "get_or_create_fcurve returned None, cannot proceed.")
        
        # --- NEW DEBUG PRINTS ---
        print(f"EP_DEBUG (Sandbox Test): F-Curve object received: {fc}")
        print(f"EP_DEBUG (Sandbox Test): Initial keyframe_points length: {len(fc.keyframe_points)}")
        
        fc.keyframe_points.insert(frame=10, value=0.5)
        
        print(f"EP_DEBUG (Sandbox Test): After insert, keyframe_points length: {len(fc.keyframe_points)}")
        # --- END NEW DEBUG PRINTS ---

        # 3. Deep-dive inspection of the Action datablock
        print("\n--- DEEP ACTION DATABLOCK INSPECTION ---")
        fcurves_found_manually = []
        
        print(f"Action: '{action.name}'")
        if hasattr(action, 'fcurves') and action.fcurves:
            print(f"  Found {len(action.fcurves)} legacy fcurves:")
            for f in action.fcurves:
                fcurves_found_manually.append(f)
                print(f"    - F-Curve on action.fcurves with data_path: {f.data_path}")

        print("\n--- END DEEP INSPECTION ---")

        # 4. Use the utility function to see what it finds
        curves_from_style_util = style.get_action_curves(action)
        
        # 5. Assertions
        self.assertGreater(len(fcurves_found_manually), 0, "Manual deep inspection found NO F-curves.")
        
        self.assertEqual(len(curves_from_style_util), len(fcurves_found_manually),
            f"Mismatch! Manual inspection found {len(fcurves_found_manually)} curves, "
            f"but get_action_curves found {len(curves_from_style_util)}.")

        print("\nSANDBOX TEST PASSED: Keyframe creation and detection work in a clean environment.")

if __name__ == '__main__':
    unittest.main(argv=sys.argv[sys.argv.index("--") + 1:])

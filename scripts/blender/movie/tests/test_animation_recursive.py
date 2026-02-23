import bpy
import unittest
import os
import sys

# Add movie root to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import style_utilities as style

print("EP_DEBUG: test_animation_recursive.py module loaded (version 6 - RECURSIVE FINDER UNIQUE)")

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

        # 2. Attempt to insert a keyframe on the pose bone
        if not armature_obj.animation_data: armature_obj.animation_data_create()
        action = armature_obj.animation_data.action
        if not action:
            action = bpy.data.actions.new(name="SandboxAction")
            armature_obj.animation_data.action = action
        
        if hasattr(action, "layers") and len(action.layers) == 0:
            action.layers.new(name="Main Layer")

        # Create F-curve
        fc = style.get_or_create_fcurve(action, 'pose.bones["TestBone"].rotation_euler', 0, ref_obj=armature_obj)
        self.assertIsNotNone(fc, "get_or_create_fcurve returned None")
        
        fc.keyframe_points.insert(frame=10, value=0.5)
        
        print("\n" + "="*50)
        print("RECURSIVE ACTION EXPLORATION")
        print("="*50)
        
        seen = set()
        found_count = 0

        def find_everything_with_keyframes(obj, path="action"):
            nonlocal found_count
            if not obj or id(obj) in seen: return
            seen.add(id(obj))
            
            if hasattr(obj, "keyframe_points") and len(obj.keyframe_points) > 0:
                print(f"FOUND: {path}")
                print(f"  Type: {type(obj)}")
                if hasattr(obj, "data_path"): print(f"  Data Path: {obj.data_path}")
                elif hasattr(obj, "path"): print(f"  Path: {obj.path}")
                found_count += 1
            
            # Recurse into everything that looks like a collection or a nested object
            props_to_check = [
                "fcurves", "layers", "slots", "bindings", "channels", "strips", 
                "action", "fcurve", "binding", "slot", "layer"
            ]
            
            # Also try to iterate if it's a collection itself
            if hasattr(obj, "__iter__") and not isinstance(obj, (str, bytes)):
                try:
                    for i, item in enumerate(obj):
                        find_everything_with_keyframes(item, f"{path}[{i}]")
                except: pass

            for prop in props_to_check:
                if hasattr(obj, prop):
                    try:
                        val = getattr(obj, prop)
                        if val is not None:
                            find_everything_with_keyframes(val, f"{path}.{prop}")
                    except: pass

        find_everything_with_keyframes(action)

        print(f"\nTOTAL NODES WITH KEYFRAMES: {found_count}")
        
        # 5. Use the utility
        curves_util = style.get_action_curves(action)
        print(f"TOTAL FOUND BY get_action_curves: {len(curves_util)}")

        self.assertGreater(found_count, 0, "Recursive finder found NO keyframes!")

if __name__ == '__main__':
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)

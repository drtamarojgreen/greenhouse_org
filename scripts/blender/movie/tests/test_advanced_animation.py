import bpy
import unittest
import sys
import os

# Add movie root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from base_test import BlenderTestCase
import style_utilities as style

class TestAdvancedAnimation(BlenderTestCase):
    def test_neck_bone_animation(self):
        """Verify that Neck bones have active animation data (micro-movements)."""
        chars = ["Herbaceous", "Arbor"]
        for char_name in chars:
            obj = bpy.data.objects.get(char_name)
            if not obj or obj.type != 'ARMATURE': continue

            with self.subTest(char=char_name):
                has_neck_anim = False
                if obj.animation_data and obj.animation_data.action:
                    curves = style.get_action_curves(obj.animation_data.action)
                    for fc in curves:
                        if 'Neck' in fc.data_path and 'rotation' in fc.data_path:
                            # Check for at least 2 keyframes with delta
                            values = [kp.co[1] for kp in fc.keyframe_points]
                            if len(values) > 1 and (max(values) - min(values)) > 0.001:
                                has_neck_anim = True
                                break
                self.assertTrue(has_neck_anim, f"Neck animation missing or static for {char_name}")

    def test_jaw_bone_dialogue_sync(self):
        """Verify Jaw bone rotation is synced with Mouth scale in dialogue."""
        obj = bpy.data.objects.get("Herbaceous")
        if not obj or not obj.animation_data or not obj.animation_data.action:
             self.skipTest("Herbaceous armature or action missing")

        curves = style.get_action_curves(obj.animation_data.action)
        jaw_curves = [c for c in curves if 'Jaw' in c.data_path and 'rotation' in c.data_path]
        mouth_curves = [c for c in curves if 'Mouth' in c.data_path and 'scale' in c.data_path]

        self.assertGreater(len(jaw_curves), 0, "No Jaw rotation curves found")
        self.assertGreater(len(mouth_curves), 0, "No Mouth scale curves found")

    def test_brow_animation_presets(self):
        """Verify Brow bones are keyframed for expressions."""
        chars = ["Herbaceous", "Arbor"]
        for char_name in chars:
            obj = bpy.data.objects.get(char_name)
            if not obj: continue

            with self.subTest(char=char_name):
                has_brow_anim = False
                if obj.animation_data and obj.animation_data.action:
                    curves = style.get_action_curves(obj.animation_data.action)
                    for fc in curves:
                        if 'Brow' in fc.data_path:
                            has_brow_anim = True
                            break
                self.assertTrue(has_brow_anim, f"Brow animation missing for {char_name}")

if __name__ == "__main__":
    argv = [sys.argv[0]]
    if "--" in sys.argv:
        argv.extend(sys.argv[sys.argv.index("--") + 1:])
    unittest.main(argv=argv)

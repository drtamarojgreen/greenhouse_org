import unittest
import bpy
import os
import sys

# Ensure scene 3 modules are in path
SCENE3_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if SCENE3_DIR not in sys.path:
    sys.path.append(SCENE3_DIR)

from generate_scene3 import generate_full_scene
import style_utilities as style
import config

class TestAuthenticPerformance(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Build the full scene once for all tests."""
        generate_full_scene()
        cls.herb = bpy.data.objects.get(config.CHAR_HERBACEOUS)
        cls.arbor = bpy.data.objects.get(config.CHAR_ARBOR)

    def test_rig_existence(self):
        """Verify armatures were created and are rigged."""
        self.assertIsNotNone(self.herb, "Herbaceous armature missing")
        self.assertEqual(self.herb.type, 'ARMATURE')
        self.assertIsNotNone(self.arbor, "Arbor armature missing")
        self.assertEqual(self.arbor.type, 'ARMATURE')

    def test_critical_bones(self):
        """Verify essential bones exist for animation."""
        for arm in [self.herb, self.arbor]:
            pb = arm.pose.bones
            self.assertIn("Mouth", pb, f"Mouth bone missing in {arm.name}")
            self.assertIn("Torso", pb, f"Torso bone missing in {arm.name}")
            self.assertIn("Eye.L", pb, f"Eye.L bone missing in {arm.name}")
            self.assertIn("Eye.R", pb, f"Eye.R bone missing in {arm.name}")

    def test_unified_action(self):
        """Verify all animations are in a single persistent action."""
        for arm in [self.herb, self.arbor]:
            self.assertIsNotNone(arm.animation_data, f"No animation data on {arm.name}")
            action = arm.animation_data.action
            self.assertIsNotNone(action, f"No active action on {arm.name}")
            self.assertTrue(action.name.startswith("Scene3"), f"Implicit action found: {action.name}")

    def test_dialogue_keyframes(self):
        """Verify dialogue keyframes exist on the Mouth bone."""
        action = self.herb.animation_data.action
        # Blender 5.0 Slotted Action compatibility
        curves = style.get_action_curves(action, obj=self.herb)
        mouth_fcurves = [fc for fc in curves if 'pose.bones["Mouth"].scale' in fc.data_path]
        self.assertGreater(len(mouth_fcurves), 0, "No mouth scale fcurves found in 5.0 action slots")
        
        # Check for keyframes in Herbaceous's talking range (starts frame 24)
        found_kp = any(any(24 <= kp.co[0] <= 120 for kp in fc.keyframe_points) for fc in mouth_fcurves)
        self.assertTrue(found_kp, "No mouth keyframes found in talking range (24-120)")

    def test_life_animation_modifiers(self):
        """Verify noise modifiers exist for breathing/blinking."""
        action = self.herb.animation_data.action
        curves = style.get_action_curves(action, obj=self.herb)
        noise_mods = []
        for fc in curves:
            for mod in fc.modifiers:
                if mod.type == 'NOISE':
                    noise_mods.append(mod)
        
        self.assertGreater(len(noise_mods), 2, "Insufficient noise modifiers for 'Life' animation")

    def test_eyeline_orientation(self):
        """Verify characters are rotated to face each other."""
        # Herbaceous (at -1.75, -0.3) facing Arbor (1.75, 0.3)
        # Vector is (3.5, 0.6), angle is ~0.17 rad. 
        # With -Y forward, Z rot should be 0.17 + pi/2 = ~1.74 rad
        self.assertGreater(self.herb.rotation_euler.z, 1.5, f"Herbaceous Z-rotation ({self.herb.rotation_euler.z}) is incorrect")
        
        # Arbor (at 1.75, 0.3) facing Herbaceous (-1.75, -0.3)
        # Vector is (-3.5, -0.6), angle is ~ -2.97 rad.
        # Z rot should be -2.97 + pi/2 = -1.4 rad
        self.assertLess(self.arbor.rotation_euler.z, -1.0, f"Arbor Z-rotation ({self.arbor.rotation_euler.z}) is incorrect")

if __name__ == "__main__":
    unittest.main(argv=['first-arg-is-ignored'], exit=False)

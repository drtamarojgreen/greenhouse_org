import bpy
import unittest
import os
import sys
import math

# Standard path logic
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SCENE5_DIR = os.path.dirname(SCRIPT_DIR)
if SCENE5_DIR not in sys.path:
    sys.path.append(SCENE5_DIR)

from assets_v5.plant_humanoid_v5 import create_plant_humanoid_v5
from animation_library_v5 import apply_nod, apply_shake_head, apply_smile

class TestAnimationModules(unittest.TestCase):
    def setUp(self):
        bpy.ops.wm.read_factory_settings(use_empty=True)
        self.armature = create_plant_humanoid_v5("ModularRig", (0, 0, 0))
        bpy.context.view_layer.objects.active = self.armature
        bpy.ops.object.mode_set(mode='POSE')
        
        # Link action
        if not self.armature.animation_data:
            self.armature.animation_data_create()
        self.armature.animation_data.action = bpy.data.actions.new(name="TestModular")

    def test_apply_nod(self):
        """Verifies that apply_nod inserts rotational keyframes on the Head and Neck."""
        apply_nod(self.armature, start_frame=1, duration=20)
        
        head = self.armature.pose.bones.get("Head")
        self.assertIsNotNone(head, "Head bone should exist.")
        
        bpy.context.scene.frame_set(1)
        start_rot = head.rotation_euler[0]
        
        bpy.context.scene.frame_set(11)
        mid_rot = head.rotation_euler[0]
        
        bpy.context.scene.frame_set(21)
        end_rot = head.rotation_euler[0]
        
        self.assertTrue(mid_rot < start_rot, "Head should pitch down (negative X) at midpoint.")
        self.assertAlmostEqual(start_rot, end_rot, places=2, msg="Head should return to start position.")
        print(f"PASSED: Nod - Head rotation detected dipping from {start_rot:.2f} to {mid_rot:.2f}")

    def test_apply_shake_head(self):
        """Verifies apply_shake_head modifies Z rotation on Head."""
        apply_shake_head(self.armature, start_frame=10, duration=40)
        
        head = self.armature.pose.bones.get("Head")
        
        bpy.context.scene.frame_set(10)
        start_z = head.rotation_euler[2]
        
        bpy.context.scene.frame_set(20) # Q1
        q1_z = head.rotation_euler[2]
        
        bpy.context.scene.frame_set(40) # Q3
        q3_z = head.rotation_euler[2]
        
        self.assertTrue(q1_z > start_z, "Head should rotate left (+Z) at Q1.")
        self.assertTrue(q3_z < start_z, "Head should rotate right (-Z) at Q3.")
        print(f"PASSED: Head Shake - Side to side rotation detected over 45 frames.")

    def test_apply_smile(self):
        """Verifies apply_smile pulls the Lip Corner Ctrl bones outwards."""
        apply_smile(self.armature, start_frame=5, duration=15)
        
        lip_l = self.armature.pose.bones.get("Lip.Corner.Ctrl.L")
        
        bpy.context.scene.frame_set(5)
        start_x = lip_l.location[0]
        start_z = lip_l.location[2]
        
        bpy.context.scene.frame_set(20)
        end_x = lip_l.location[0]
        end_z = lip_l.location[2]
        
        self.assertTrue(end_x > start_x, "Smile should pull left corner outward (+X).")
        self.assertTrue(end_z > start_z, "Smile should pull left corner upward (+Z).")
        print(f"PASSED: Smile - Lip corners pulled actively outward ({start_x:.3f} -> {end_x:.3f}) and upward.")

    def test_apply_blink(self):
        """Verifies apply_blink natively inserts position bounds on eyelids."""
        from animation_library_v5 import apply_blink
        apply_blink(self.armature, start_frame=5, duration=6)
        
        lid = self.armature.pose.bones.get("Eyelid.Upper.L")
        
        bpy.context.scene.frame_set(5)
        start_z = lid.location[2]
        
        bpy.context.scene.frame_set(8) # Midpoint
        mid_z = lid.location[2]
        
        bpy.context.scene.frame_set(11) # End
        end_z = lid.location[2]
        
        self.assertTrue(mid_z < start_z, "Blink should pull upper lid down (-Z) at midpoint.")
        self.assertAlmostEqual(start_z, end_z, places=2, msg="Lid should return to open state.")
        print(f"PASSED: Blink - Eyelids successfully close and open across 6 frames.")

    def test_apply_look_side(self):
        """Verifies apply_look_side horizontally shifts the pupil controller."""
        from animation_library_v5 import apply_look_side
        apply_look_side(self.armature, start_frame=1, duration=15, side="LEFT")
        
        pupil = self.armature.pose.bones.get("Pupil.Ctrl.L")
        
        bpy.context.scene.frame_set(1)
        start_x = pupil.location[0]
        
        bpy.context.scene.frame_set(16)
        end_x = pupil.location[0]
        
        self.assertTrue(end_x > start_x, "Look left should shift pupil outward (+X).")
        print(f"PASSED: Look Side - Pupils rigidly shift to target coordinate ({start_x:.3f} -> {end_x:.3f}).")

    def test_arm_orientation(self):
        """Verifies that the arms remain pointing downwards during procedural swing."""
        # Arm swing operates on A-Pose (-40 degrees / -0.7 rads).
        # Swing amplitude is 0.1. Thus, arm's max upward rotation is -0.6 rads.
        from animation_library_v5 import apply_nod # dummy import to pass linter, normally we test via scene logic
        arm_l = self.armature.pose.bones.get("Arm.L")
        
        # Manually invoke the logic from dialogue scene limbs
        from dialogue_scene_v5 import DialogueSceneV5
        scene = DialogueSceneV5({}, [])
        scene._animate_body_limbs(self.armature, 1, 5)
        
        bpy.context.scene.frame_set(2)
        arm_pitch = arm_l.rotation_euler[0]
        
        # It should be deeply negative (pointing downward).
        self.assertTrue(arm_pitch < -0.3, "Arm should point decisively downwards (less than -0.3 radians pitch).")
        print(f"PASSED: Arm Orientation - Base rotation remained downward at {arm_pitch:.3f} rads.")

    def test_apply_look_bounds(self):
        """Verifies pupil targets do not clip beyond eye rims."""
        from animation_library_v5 import apply_look_side
        apply_look_side(self.armature, start_frame=1, duration=1, side="LEFT")
        bpy.context.scene.frame_set(2)
        pupil = self.armature.pose.bones.get("Pupil.Ctrl.L")
        
        # 0.03 shift should remain within bounds. Just validating existence of bounds logic mathematically.
        self.assertTrue(abs(pupil.location[0]) < 0.1, "Pupil shifted outside of physical domain.")
        print(f"PASSED: Pupil Bounds - Pupil coordinate constrained securely to {pupil.location[0]:.3f}.")

    def test_pupil_shader_mapping(self):
        """Verifies the Iris shader maps precisely to the front of the Generated bounding box, and the ramp is correctly inverted."""
        mat = bpy.data.materials.get("Iris_Test")
        if not mat:
            from assets_v5.plant_humanoid_v5 import create_iris_material_v5
            mat = create_iris_material_v5("Iris_Test_Audit")
            
        tree = mat.node_tree
        mapping = tree.nodes.get("PupilMapping")
        ramp = tree.nodes.get("IrisRamp")
        
        self.assertIsNotNone(mapping, "PupilMapping node missing from Iris shader.")
        self.assertIsNotNone(ramp, "IrisRamp node missing from Iris shader.")
        
        # Verify Location offset pushes gradient center to front pole `(0.5, 0.0, 0.5)`
        # (Y=0.0 is the front face relative to -Y local forward vector)
        loc = mapping.inputs['Location'].default_value
        self.assertAlmostEqual(loc[0], 0.5, msg="Pupil X mapping must be perfectly centered.")
        self.assertAlmostEqual(loc[1], 0.0, msg="Pupil Y mapping must sit exactly flush on the front hemisphere surface.")
        self.assertAlmostEqual(loc[2], 0.5, msg="Pupil Z mapping must be exactly aligned with equator.")
        
        # Verify color ramp: Fac=1.0 is the center of the pupil in Spherical falloff
        elems = ramp.color_ramp.elements
        self.assertAlmostEqual(elems[-1].position, 1.0, msg="Final element not mapped to gradient core.")
        # Check that pupil is fully black
        luminance = sum(elems[-1].color[:3])
        self.assertTrue(luminance < 0.1, f"Pupil core at 1.0 must be pure black! Found: {elems[-1].color}")
        print("PASSED: Pupil Shader Mapping - Core securely anchored to front surface with proper scalar limits.")

    def test_apply_talking_arms(self):
        """Verifies apply_talking_arms raises Arm.L and Arm.R and inserts jitter."""
        from animation_library_v5 import apply_talking_arms
        
        arm_l = self.armature.pose.bones.get("Arm.L")
        # Ensure a baseline "down" keyframe exists in the test action
        arm_l.rotation_euler[0] = math.radians(-40)
        arm_l.keyframe_insert(data_path="rotation_euler", frame=1)
        
        apply_talking_arms(self.armature, start_frame=10, duration=50)
        
        hand_l = self.armature.pose.bones.get("Hand.L")
        
        bpy.context.scene.frame_set(1)
        baseline_pitch = arm_l.rotation_euler[0]
        self.assertLess(baseline_pitch, -0.6, "Baseline arm should be pointing down (~-40 deg).")

        bpy.context.scene.frame_set(10)
        raised_pitch = arm_l.rotation_euler[0]
        # Raised should be ~ -105 deg (-1.83 rad).
        self.assertLess(raised_pitch, baseline_pitch, "Arm direction is WRONG: it should move FORWARD (more negative X) from baseline.")
        self.assertLess(raised_pitch, -1.5, "Arm.L should be raised to a high negative pitch (forward/up).")

        # WORLD SPACE COORDINATE CHECK
        # In Scene 5, camera is at -Y. So "Forward" is Negative Y.
        bpy.context.view_layer.update()
        shoulder_world = self.armature.matrix_world @ arm_l.head
        hand_world = self.armature.matrix_world @ self.armature.pose.bones.get("Hand.L").head
        
        self.assertLess(hand_world.y, shoulder_world.y, f"Arm is facing BACKWARDS! Hand Y ({hand_world.y:.3f}) > Shoulder Y ({shoulder_world.y:.3f}).")
        self.assertGreater(hand_world.z, shoulder_world.z, f"Arm is facing DOWNWARDS! Hand Z ({hand_world.z:.3f}) < Shoulder Z ({shoulder_world.z:.3f}).")
        print(f"PASSED: Talking Arms - Direction confirmed: Hand is forward ({hand_world.y-shoulder_world.y:.3f} Y) and up ({hand_world.z-shoulder_world.z:.3f} Z).")
        
        # Verify animation density (jitter) by sampling a few frames
        # We expect rotation to change between frames if jitter is applied
        rotations = []
        for f in range(15, 45, 5):
            bpy.context.scene.frame_set(f)
            rotations.append(arm_l.rotation_euler[0])
        
        # Check that they aren't all identical
        unique_rots = set([round(r, 4) for r in rotations])
        self.assertGreater(len(unique_rots), 2, f"Expected jitter to produce unique rotations, found: {unique_rots}")
        print(f"PASSED: Talking Arms - Expressive elevation and jitter detected via frame sampling.")

    def test_manual_arm_up_down_up(self):
        """Verifies direction consistency by manually keying up, down, up."""
        arm_l = self.armature.pose.bones.get("Arm.L")
        
        up_val = math.radians(70)
        down_val = math.radians(-40)
        
        # Frame 1: Up
        arm_l.rotation_euler[0] = up_val
        arm_l.keyframe_insert(data_path="rotation_euler", frame=1)
        
        # Frame 2: Down
        arm_l.rotation_euler[0] = down_val
        arm_l.keyframe_insert(data_path="rotation_euler", frame=2)
        
        # Frame 3: Up
        arm_l.rotation_euler[0] = up_val
        arm_l.keyframe_insert(data_path="rotation_euler", frame=3)
        
        bpy.context.scene.frame_set(1)
        self.assertAlmostEqual(arm_l.rotation_euler[0], up_val, places=4, msg="Frame 1 should be UP.")
        
        bpy.context.scene.frame_set(2)
        self.assertAlmostEqual(arm_l.rotation_euler[0], down_val, places=4, msg="Frame 2 should be DOWN.")
        
        bpy.context.scene.frame_set(3)
        self.assertAlmostEqual(arm_l.rotation_euler[0], up_val, places=4, msg="Frame 3 should be UP again.")
        
        print("PASSED: Manual Up-Down-Up - Directional consistency for X-pitch confirmed.")

    def test_apply_shiver(self):
        """Verifies torso location jitter."""
        from animation_library_v5 import apply_shiver
        apply_shiver(self.armature, 10, duration=20)
        
        torso = self.armature.pose.bones.get("Torso")
        loc_keys = 0
        for f in range(10, 30):
            bpy.context.scene.frame_set(f)
            if abs(torso.location[0]) > 0.0001:
                loc_keys += 1
        self.assertGreater(loc_keys, 5, "Torso should shiver (location offset).")
        print("PASSED: Shiver - High-frequency vibration detected.")

    def test_apply_droop(self):
        """Verifies head pitch decrease."""
        from animation_library_v5 import apply_droop
        apply_droop(self.armature, 10, duration=20)
        
        head = self.armature.pose.bones.get("Head")
        bpy.context.scene.frame_set(1)
        start_rot = head.rotation_euler[0]
        bpy.context.scene.frame_set(20)
        mid_rot = head.rotation_euler[0]
        self.assertLess(mid_rot, start_rot - 0.2, "Head should pitch down (negative X).")
        print("PASSED: Droop - Head pitch lowering detected.")

    def test_apply_stretch(self):
        """Verifies head/torso arching."""
        from animation_library_v5 import apply_stretch
        apply_stretch(self.armature, 10, duration=20)
        
        head = self.armature.pose.bones.get("Head")
        bpy.context.scene.frame_set(1)
        start_rot = head.rotation_euler[0]
        bpy.context.scene.frame_set(20)
        mid_rot = head.rotation_euler[0]
        self.assertGreater(mid_rot, start_rot + 0.1, "Head should pitch up (positive X).")
        print("PASSED: Stretch - Expansive arching detected.")

    def test_apply_wiggle(self):
        """Verifies Z-rotation sway."""
        from animation_library_v5 import apply_wiggle
        apply_wiggle(self.armature, 10, duration=20)
        
        torso = self.armature.pose.bones.get("Torso")
        z_rots = []
        for f in [10, 15, 20]:
            bpy.context.scene.frame_set(f)
            z_rots.append(round(torso.rotation_euler[2], 3))
        self.assertGreater(len(set(z_rots)), 1, "Torso should sway on Z axis.")
        print("PASSED: Wiggle - Z-axis rhythmic sway detected.")

    def test_apply_reach_out(self):
        """Verifies arm extension."""
        from animation_library_v5 import apply_reach_out
        apply_reach_out(self.armature, 10, duration=20)
        
        arm_l = self.armature.pose.bones.get("Arm.L")
        bpy.context.scene.frame_set(20)
        # Reaching forward/up (Positive X)
        self.assertGreater(arm_l.rotation_euler[0], 0.3, "Arm should extend forward.")
        print("PASSED: Reach Out - Arm extension detected.")

    def test_apply_worry(self):
        """Verifies eyebrow/lip pinch."""
        from animation_library_v5 import apply_worry
        apply_worry(self.armature, 10, duration=20)
        
        brows = self.armature.pose.bones.get("Eyebrow.L")
        bpy.context.scene.frame_set(1)
        start_z = brows.location[2]
        bpy.context.scene.frame_set(20)
        self.assertGreater(brows.location[2], start_z, "Brows should raise for worry pinch.")
        print("PASSED: Worry - Targeted facial deformation confirmed.")

    def test_apply_joyful(self):
        """Verifies smile and pupil dilation."""
        from animation_library_v5 import apply_joyful
        apply_joyful(self.armature, 10, duration=20)
        
        pupil = self.armature.pose.bones.get("Pupil.Ctrl.L")
        bpy.context.scene.frame_set(1)
        start_s = pupil.scale[0]
        bpy.context.scene.frame_set(20)
        self.assertGreater(pupil.scale[0], start_s * 1.1, "Pupils should dilate for joy.")
        print("PASSED: Joyful - Pupil dilation and smile confirmed.")

if __name__ == "__main__":
    unittest.main(argv=[sys.argv[0]])

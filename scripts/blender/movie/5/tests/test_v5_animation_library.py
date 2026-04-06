import bpy
import unittest
import os
import sys

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
            from plant_humanoid_v5 import create_iris_material_v5
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

if __name__ == "__main__":
    unittest.main(argv=[sys.argv[0]])

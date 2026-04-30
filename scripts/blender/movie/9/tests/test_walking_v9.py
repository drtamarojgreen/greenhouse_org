import unittest
import bpy
import os
import sys
import math

# Ensure we can import Movie 9 modules
M9_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M9_ROOT not in sys.path:
    sys.path.insert(0, M9_ROOT)

from animation_handler import AnimationHandler

class TestWalkingV9(unittest.TestCase):
    def test_independent_limb_coordination(self):
        """Verifies that the walk cycle coordinates limbs independently."""
        # Create a dummy armature
        bpy.ops.object.armature_add()
        rig = bpy.context.active_object

        # Create dummy bones
        bpy.ops.object.mode_set(mode='EDIT')
        for bname in ["Torso", "Leg.L", "Leg.R", "Hand.L", "Hand.R"]:
            if bname not in rig.data.edit_bones:
                b = rig.data.edit_bones.new(bname)
                b.head = (0,0,0); b.tail = (0,0,1)
        bpy.ops.object.mode_set(mode='POSE')

        handler = AnimationHandler()
        handler._animate_walk(rig, start=1, duration=40)

        # Check a frame where Leg.L and Leg.R should be offset
        # Leg.L uses cos(phase), Leg.R uses cos(phase + 0.5)
        # At f=11, phase=0.25. Leg.L ~ cos(0.5pi)=0, Leg.R ~ cos(pi)=-1

        # Note: keyframe_insert might not update pose until frame_set
        bpy.context.scene.frame_set(11)
        leg_l = rig.pose.bones["Leg.L"].rotation_euler[0]
        leg_r = rig.pose.bones["Leg.R"].rotation_euler[0]

        self.assertNotAlmostEqual(leg_l, leg_r, places=2, msg="Legs are moving in perfect sync; independent stride failed.")

if __name__ == "__main__":
    unittest.main()

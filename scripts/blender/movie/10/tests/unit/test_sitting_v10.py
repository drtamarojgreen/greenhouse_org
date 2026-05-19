import unittest
try: import bpy
except ImportError: bpy = None
import os
import sys
import math

# Ensure we can import Movie 10 modules
M10_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if M10_ROOT not in sys.path:
    sys.path.insert(0, M10_ROOT)
try:
    import movie_configuration as mc
except ImportError:
    from . import movie_configuration as mc

try:
    try:
    from animation_handler import
except ImportError:
    from ..animation_handler import AnimationHandler
except ImportError:
    from .animation_handler import AnimationHandler

class TestSittingV10(unittest.TestCase):
    def test_seated_posture_transforms(self):
        """Verifies that the sit animation applies correct bone angles."""
        bpy.ops.object.armature_add()
        rig = bpy.context.active_object

        bpy.ops.object.mode_set(mode='EDIT')
        for bname in ["Torso", "Leg.L", "Leg.R", "Knee.L", "Knee.R"]:
            if bname not in rig.data.edit_bones:
                b = rig.data.edit_bones.new(bname)
                b.head = (0,0,0); b.tail = (0,0,1)
        bpy.ops.object.mode_set(mode='POSE')

        handler = AnimationHandler()
        handler.apply_animation(rig, "sit", 1, 40)

        bpy.context.scene.frame_set(41)

        # Check Thighs (Leg.L/R)
        thigh_l_rot = rig.pose.bones["Leg.L"].rotation_euler[0]
        self.assertAlmostEqual(thigh_l_rot, math.radians(90), places=2)

        # Check Knees
        knee_r_rot = rig.pose.bones["Knee.R"].rotation_euler[0]
        self.assertAlmostEqual(knee_r_rot, math.radians(-90), places=2)

        # Check Torso vertical offset
        torso_z = rig.pose.bones["Torso"].location[2]
        self.assertAlmostEqual(torso_z, -0.6, places=4)

if __name__ == "__main__":
    unittest.main()

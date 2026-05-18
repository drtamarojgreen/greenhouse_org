import bpy
import bmesh
import math
import mathutils
from .base import Rigger
from .registry import registry

class PlantRigger(Rigger):
    """
    Specific Rigger for Procedural Plant Humanoids.
    Bone hierarchy including High-Fidelity facial rigging for Movie 10.
    """

    def build_rig(self, char_id, params):
        height_scale = params.get("height_scale", 1.0)
        torso_h = 1.5 * height_scale
        head_r  = 0.4
        neck_h  = 0.2

        armature_data = bpy.data.armatures.new(f"{char_id}_ArmatureData")
        armature_obj = bpy.data.objects.new(f"{char_id}.Rig", armature_data)
        bpy.context.scene.collection.objects.link(armature_obj)

        bpy.context.view_layer.objects.active = armature_obj
        bpy.ops.object.mode_set(mode='EDIT')

        bones_def = {
            "Torso": ((0,0,0), (0,0,torso_h), None),
            "Neck":  ((0,0,torso_h), (0,0,torso_h+neck_h), "Torso"),
            "Head":  ((0,0,torso_h+neck_h), (0,0,torso_h+neck_h+head_r*2), "Neck"),
            "Shoulder.L": ((0.2, 0, torso_h*0.9), (0.4, 0, torso_h*0.9), "Torso"),
            "Arm.L":      ((0.4, 0, torso_h*0.9), (0.4, 0, torso_h*0.9-0.4), "Shoulder.L"),
            "Elbow.L":    ((0.4, 0, torso_h*0.9-0.4), (0.4, 0, torso_h*0.9-0.8), "Arm.L"),
            "Shoulder.R": ((-0.2, 0, torso_h*0.9), (-0.4, 0, torso_h*0.9), "Torso"),
            "Arm.R":      ((-0.4, 0, torso_h*0.9), (-0.4, 0, torso_h*0.9-0.4), "Shoulder.R"),
            "Elbow.R":    ((-0.4, 0, torso_h*0.9-0.4), (-0.4, 0, torso_h*0.9-0.8), "Arm.R"),
            "Hip.L":   ((0.15, 0, 0.1), (0.25, 0, 0.1), "Torso"),
            "Thigh.L": ((0.25, 0, 0.1), (0.25, 0, -0.4), "Hip.L"),
            "Knee.L":  ((0.25, 0, -0.4), (0.25, 0, -0.9), "Thigh.L"),
            "Hip.R":   ((-0.15, 0, 0.1), (-0.25, 0, 0.1), "Torso"),
            "Thigh.R": ((-0.25, 0, 0.1), (-0.25, 0, -0.4), "Hip.R"),
            "Knee.R":  ((-0.25, 0, -0.4), (-0.25, 0, -0.9), "Thigh.R"),
            "Hand.L":     ((0.4, 0, torso_h*0.9-0.8),  (0.4, 0, torso_h*0.9-0.95), "Elbow.L"),
            "Hand.R":     ((-0.4, 0, torso_h*0.9-0.8),  (-0.4, 0, torso_h*0.9-0.95), "Elbow.R"),
            "Foot.L":  ((0.25, 0, -0.9),     (0.25,-0.15,-0.95), "Knee.L"),
            "Foot.R":  ((-0.25, 0, -0.9),    (-0.25,-0.15,-0.95), "Knee.R"),
            "Foliage":   ((0, 0, torso_h+neck_h+head_r), (0, 0, torso_h+neck_h+head_r+0.5), "Head"),
        }

        hcz = torso_h + neck_h + head_r
        facial_bones = {
            "Ear.L": ((head_r*0.9, 0, hcz), (head_r*1.1, 0, hcz+0.1), "Head"),
            "Ear.R": ((-head_r*0.9, 0, hcz), (-head_r*1.1, 0, hcz+0.1), "Head"),
            "Eye.L": ((head_r*0.35, -head_r*0.84, hcz+head_r*0.35), (head_r*0.35, -head_r*0.92, hcz+head_r*0.35), "Head"),
            "Eye.R": ((-head_r*0.35,-head_r*0.84, hcz+head_r*0.35), (-head_r*0.35,-head_r*0.92, hcz+head_r*0.35), "Head"),
            "Lip.Upper": ((0, -head_r*0.96, hcz-head_r*0.18), (0, -head_r*1.06, hcz-head_r*0.18), "Head"),
            "Lip.Lower": ((0, -head_r*0.95, hcz-head_r*0.24), (0, -head_r*1.05, hcz-head_r*0.24), "Head"),
        }
        bones_def.update(facial_bones)

        for bname, (h, t, p) in bones_def.items():
            bone = armature_data.edit_bones.new(bname)
            bone.head, bone.tail = h, t
            if p: bone.parent = armature_data.edit_bones[p]
            bone.use_deform = True

        bpy.ops.object.mode_set(mode='POSE')
        for pb in armature_obj.pose.bones:
            pb.rotation_mode = 'XYZ'

        bpy.ops.object.mode_set(mode='OBJECT')
        return armature_obj

registry.register_rigging("PlantRigger", PlantRigger)

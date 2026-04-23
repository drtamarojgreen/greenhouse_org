import bpy
import os
import sys
import math
import mathutils

from base import Rigger
from registry import registry

# Make sure we can import facial_utilities_v6 if needed, or we implement facial bones locally.
M6_ASSETS = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "6", "assets_v6")
if M6_ASSETS not in sys.path:
    sys.path.insert(0, M6_ASSETS)

try:
    from facial_utilities_v6 import create_facial_props_v6
except ImportError:
    create_facial_props_v6 = None

class PlantRigger(Rigger):
    """Specific Rigger for Procedural Plant Humanoids."""

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
            "Ear.L": ((head_r*0.9, 0, torso_h+neck_h+head_r), (head_r*1.1, 0, torso_h+neck_h+head_r+0.1), "Head"),
            "Ear.R": ((-head_r*0.9, 0, torso_h+neck_h+head_r), (-head_r*1.1, 0, torso_h+neck_h+head_r+0.1), "Head"),
            "Eye.L": ((head_r*0.35, -head_r*0.84, torso_h+neck_h+head_r*1.35), (head_r*0.35, -head_r*0.92, torso_h+neck_h+head_r*1.35), "Head"),
            "Eye.R": ((-head_r*0.35,-head_r*0.84, torso_h+neck_h+head_r*1.35), ((-head_r*0.35,-head_r*0.92, torso_h+neck_h+head_r*1.35)), "Head"),
            "Eyelid.Upper.L": ((head_r*0.35, -head_r*0.84, torso_h+neck_h+head_r*1.40), (head_r*0.35, -head_r*0.92, torso_h+neck_h+head_r*1.40), "Head"),
            "Eyelid.Lower.L": ((head_r*0.35, -head_r*0.84, torso_h+neck_h+head_r*1.30), (head_r*0.35, -head_r*0.92, torso_h+neck_h+head_r*1.30), "Head"),
            "Eyelid.Upper.R": ((-head_r*0.35,-head_r*0.84, torso_h+neck_h+head_r*1.40), ((-head_r*0.35,-head_r*0.92, torso_h+neck_h+head_r*1.40)), "Head"),
            "Eyelid.Lower.R": ((-head_r*0.35,-head_r*0.84, torso_h+neck_h+head_r*1.30), ((-head_r*0.35,-head_r*0.92, torso_h+neck_h+head_r*1.30)), "Head"),
            "Eyebrow.L": ((head_r*0.35, -head_r*0.81, torso_h+neck_h+head_r*1.45), (head_r*0.4,  -head_r*0.89, torso_h+neck_h+head_r*1.45), "Head"),
            "Eyebrow.R": ((-head_r*0.35,-head_r*0.81, torso_h+neck_h+head_r*1.45), ((-head_r*0.4, -head_r*0.89, torso_h+neck_h+head_r*1.45)), "Head"),
            "Nose": ((0, -head_r*0.97, torso_h+neck_h+head_r*1.05), (0, -head_r*1.07, torso_h+neck_h+head_r*1.05), "Head"),
            "Lip.Upper": ((0, -head_r*0.96, torso_h+neck_h+head_r*0.82), (0, -head_r*1.06, torso_h+neck_h+head_r*0.82), "Head"),
            "Lip.Lower": ((0, -head_r*0.95, torso_h+neck_h+head_r*0.76), (0, -head_r*1.05, torso_h+neck_h+head_r*0.76), "Head"),
            "Finger.1.L": ((0.4, 0, torso_h*0.9-0.95), (0.45,0, torso_h*0.9-1.1),  "Hand.L"),
            "Finger.2.L": ((0.4, 0, torso_h*0.9-0.95), (0.4, 0.05, torso_h*0.9-1.1), "Hand.L"),
            "Finger.3.L": ((0.4, 0, torso_h*0.9-0.95), (0.35,0, torso_h*0.9-1.1),  "Hand.L"),
            "Finger.1.R": ((-0.4, 0, torso_h*0.9-0.95), (-0.45,0, torso_h*0.9-1.1), "Hand.R"),
            "Finger.2.R": ((-0.4, 0, torso_h*0.9-0.95), (-0.4, 0.05, torso_h*0.9-1.1), "Hand.R"),
            "Finger.3.R": ((-0.4, 0, torso_h*0.9-0.95), (-0.35,0, torso_h*0.9-1.1), "Hand.R"),
            "Toe.1.L": ((0.25,-0.15,-0.95),  (0.32,-0.45,-0.95), "Foot.L"),
            "Toe.2.L": ((0.25,-0.15,-0.95),  (0.25,-0.5, -0.95), "Foot.L"),
            "Toe.3.L": ((0.25,-0.15,-0.95),  (0.18,-0.45,-0.95), "Foot.L"),
            "Toe.1.R": ((-0.25,-0.15,-0.95), (-0.32,-0.45,-0.95), "Foot.R"),
            "Toe.2.R": ((-0.25,-0.15,-0.95), (-0.25,-0.5, -0.95), "Foot.R"),
            "Toe.3.R": ((-0.25,-0.15,-0.95), (-0.18,-0.45,-0.95), "Foot.R"),
        }

        def _sphere_surface_y(x_norm, z_norm):
            inner = max(0.0, 1.0 - x_norm ** 2 - z_norm ** 2)
            return -math.sqrt(inner)

        hcz = torso_h + neck_h + head_r

        def proj(x_norm, z_norm, tail_len=0.1, x_norm_tail=None, z_norm_tail=None):
            y_surf = _sphere_surface_y(x_norm, z_norm)
            hx = head_r * x_norm
            hy = head_r * y_surf
            hz = hcz + head_r * z_norm
            if x_norm_tail is not None and z_norm_tail is not None:
                ty_surf = _sphere_surface_y(x_norm_tail, z_norm_tail)
                tx = head_r * x_norm_tail
                ty = head_r * ty_surf
                tz = hcz + head_r * z_norm_tail
            else:
                dir_vec = mathutils.Vector((hx, hy, hz - hcz)).normalized()
                tx = hx + dir_vec.x * head_r * tail_len
                ty = hy + dir_vec.y * head_r * tail_len
                tz = hz + dir_vec.z * head_r * tail_len
            return (hx, hy, hz), (tx, ty, tz)

        def ctrl(base_head, offset=(0, 0, 0), tail_offset=(0, 0.01, 0)):
            hx = base_head[0] + offset[0]
            hy = base_head[1] + offset[1]
            hz = base_head[2] + offset[2]
            tx = hx + tail_offset[0]
            ty = hy + tail_offset[1]
            tz = hz + tail_offset[2]
            return (hx, hy, hz), (tx, ty, tz)

        eye_x, eye_z        = 0.35,  0.35
        eld_u_x, eld_u_z    = 0.35,  0.40
        eld_l_x, eld_l_z    = 0.35,  0.30
        nose_x,  nose_z     = 0.00,  0.05
        lip_u_x, lip_u_z    = 0.00, -0.18
        lip_l_x, lip_l_z    = 0.00, -0.24

        pupil_x, pupil_z    = eye_x, eye_z
        eld_corner_med_x    = 0.15
        eld_corner_lat_x    = 0.52
        eld_corner_z        = 0.35
        nose_ala_x          = 0.18
        nose_ala_z          = 0.02
        lip_corner_x        = 0.20
        lip_corner_z        = -0.21
        chin_x, chin_z      = 0.00, -0.38

        defs = {}
        eye_y_center = -head_r * 0.84
        for side, sx in (("L", 1), ("R", -1)):
            xn = sx * pupil_x
            ph = (head_r * xn, eye_y_center - 0.043, hcz + head_r * pupil_z)
            pt = (ph[0], ph[1] - 0.04, ph[2])
            defs[f"Pupil.{side}"] = (ph, pt, f"Eye.{side}", 'structural')
            base = ph
            ch, ct = ctrl(base, offset=(0, 0, 0), tail_offset=(0, -0.05, 0))
            defs[f"Pupil.Ctrl.{side}"] = (ch, ct, f"Pupil.{side}", 'control')

            xn = sx * eld_corner_med_x
            h, t = proj(xn, eld_corner_z, tail_len=0.08)
            defs[f"Eyelid.Corner.Med.{side}"] = (h, t, "Head", 'structural')

            xn = sx * eld_corner_lat_x
            h, t = proj(xn, eld_corner_z, tail_len=0.08)
            defs[f"Eyelid.Corner.Lat.{side}"] = (h, t, "Head", 'structural')

            xn = sx * eld_u_x
            y_u = head_r * _sphere_surface_y(eld_u_x, eld_u_z)
            z_u = hcz + head_r * eld_u_z
            base_u = (head_r * xn, y_u, z_u)
            y_l = head_r * _sphere_surface_y(eld_l_x, eld_l_z)
            z_l = hcz + head_r * eld_l_z
            xn_l = sx * eld_l_x
            base_l = (head_r * xn_l, y_l, z_l)
            ch_u, ct_u = ctrl(base_u, offset=(0, -head_r * 0.02, head_r * 0.05), tail_offset=(0, -head_r * 0.02, head_r * 0.08))
            defs[f"Eyelid.Ctrl.Upper.{side}"] = (ch_u, ct_u, f"Eyelid.Upper.{side}", 'control')
            ch_l, ct_l = ctrl(base_l, offset=(0, -head_r * 0.02, -head_r * 0.05), tail_offset=(0, -head_r * 0.02, -head_r * 0.08))
            defs[f"Eyelid.Ctrl.Lower.{side}"] = (ch_l, ct_l, f"Eyelid.Lower.{side}", 'control')

            xn = sx * nose_ala_x
            h_ala, t_ala = proj(xn, nose_ala_z, tail_len=0.10)
            defs[f"Nose.Ala.{side}"] = (h_ala, t_ala, "Nose", 'structural')
            base_ala = h_ala
            ch_f, ct_f = ctrl(base_ala, offset=(0, -head_r * 0.02, 0), tail_offset=(0, -head_r * 0.05, 0))
            defs[f"Nose.Flare.{side}"] = (ch_f, ct_f, f"Nose.Ala.{side}", 'control')

            xn = sx * lip_corner_x
            h, t = proj(xn, lip_corner_z, tail_len=0.08)
            defs[f"Lip.Corner.{side}"] = (h, t, "Head", 'structural')
            base_lc = h
            ch, ct = ctrl(base_lc, offset=(sx * head_r * 0.03, -head_r * 0.02, 0), tail_offset=(sx * head_r * 0.03, -head_r * 0.05, 0))
            defs[f"Lip.Corner.Ctrl.{side}"] = (ch, ct, f"Lip.Corner.{side}", 'control')

        h_tip, t_tip = proj(0.0, nose_z - 0.04, tail_len=0.15)
        defs["Nose.Tip"] = (h_tip, t_tip, "Nose", 'structural')

        h_chin, t_chin = proj(chin_x, chin_z, tail_len=0.12)
        defs["Chin"] = (h_chin, t_chin, "Head", 'structural')
        base_chin = h_chin
        ch_jaw, ct_jaw = ctrl(base_chin, offset=(0, head_r * 0.05, -head_r * 0.08), tail_offset=(0, head_r * 0.05, -head_r * 0.14))
        defs["Jaw.Ctrl"] = (ch_jaw, ct_jaw, "Chin", 'control')

        for bname, (h, t, p) in bones_def.items():
            bone = armature_data.edit_bones.new(bname)
            bone.head, bone.tail = h, t
            if bname == "Head": bone.roll = math.radians(180)
            if p: bone.parent = armature_data.edit_bones[p]

            deform_bones = ["Torso", "Neck", "Head", "Arm.L", "Elbow.L", "Hand.L", "Finger.1.L", "Finger.2.L", "Finger.3.L", "Thigh.L", "Knee.L", "Foot.L", "Toe.1.L", "Toe.2.L", "Toe.3.L", "Arm.R", "Elbow.R", "Hand.R", "Finger.1.R", "Finger.2.R", "Finger.3.R", "Thigh.R", "Knee.R", "Foot.R", "Toe.1.R", "Toe.2.R", "Toe.3.R", "Foliage"]
            if bname in deform_bones:
                bone.use_deform = True
            else:
                bone.use_deform = False

        for bname, (h, t, p_name, btype) in defs.items():
            bone = armature_data.edit_bones.new(bname)
            bone.head, bone.tail = h, t
            bone.use_deform = False
            if p_name and p_name in armature_data.edit_bones:
                bone.parent = armature_data.edit_bones[p_name]

        bpy.ops.object.mode_set(mode='POSE')
        for pb in armature_obj.pose.bones:
            pb.rotation_mode = 'XYZ'

        for side in ("L", "R"):
            mult = 1 if side == "L" else -1
            if f"Arm.{side}" in armature_obj.pose.bones:
                bone = armature_obj.pose.bones[f"Arm.{side}"]
                bone.rotation_euler[0] = math.radians(-40)
                bone.rotation_euler[2] = math.radians(-40 * mult)
            if f"Elbow.{side}" in armature_obj.pose.bones:
                ebone = armature_obj.pose.bones[f"Elbow.{side}"]
                ebone.rotation_euler[0] = math.radians(30)

        bpy.ops.object.mode_set(mode='OBJECT')

        if create_facial_props_v6:
            # We don't have exact material handling here inside rigger, 
            # so we let the UniversalShader attach materials later or handle facial props if needed.
            # But create_facial_props_v6 needs materials to exist. UniversalShader normally applies materials.
            # We will handle props directly or let UniversalShader do it.
            # The user asked for "using the modularity and json of 7", meaning UniversalShader 
            # handles materials, so we might not need to call the v6 prop builder here,
            # or we can rely on `UniversalShader` creating basic geometry.
            # However, the user specifically mentioned "built exactly like 6".
            # We will call it without materials to generate the physical eyes/lips.
            try:
                bones_map = {b.name: b.name for b in armature_obj.data.bones}
                create_facial_props_v6(char_id, armature_obj, bones_map, None, None, None, None)
            except Exception as e:
                print(f"Warning: could not create facial props: {e}")

        return armature_obj

registry.register_rigging("PlantRigger", PlantRigger)

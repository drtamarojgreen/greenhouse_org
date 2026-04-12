import bpy
import bmesh
import mathutils
import math
import random
import os
import sys

# prioritize v6 paths
V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)

# prioritize assets_v6 for cross-utility imports
ASSETS_V6_DIR = os.path.dirname(os.path.abspath(__file__))
if ASSETS_V6_DIR not in sys.path: sys.path.insert(0, ASSETS_V6_DIR)

# Standardize movie/ in path so style_utilities can be found
MOVIE_ROOT = os.path.dirname(V6_DIR)
if MOVIE_ROOT not in sys.path: sys.path.append(MOVIE_ROOT)

import style_utilities as style

# Absolute imports from top-level prioritized paths
import config
from facial_utilities_v6 import create_facial_props_v6

def create_bark_material_v6(name, color=(0.15, 0.08, 0.05)):
    """High-Contrast Mahogany Bark for Chroma Keying."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()

    node_out = nodes.new('ShaderNodeOutputMaterial')
    node_bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])

    node_bsdf.inputs['Base Color'].default_value = (*color, 1)
    node_bsdf.inputs['Roughness'].default_value = 0.98
    style.set_principled_socket(node_bsdf, "Subsurface Weight", 0.02)

    node_noise = nodes.new('ShaderNodeTexNoise')
    node_noise.inputs['Scale'].default_value = 100.0
    node_bump = nodes.new('ShaderNodeBump')
    node_bump.inputs['Strength'].default_value = 0.3
    links.new(node_noise.outputs['Fac'], node_bump.inputs['Height'])
    links.new(node_bump.outputs['Normal'], node_bsdf.inputs['Normal'])

    return mat

def create_lip_material_v6(name):
    """Pinkish-Red fleshy material for lip visibility."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs['Base Color'].default_value = (0.8, 0.2, 0.3, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.4 # Slight sheen
    return mat

def create_iris_material_v6(name, color=(0.36, 0.24, 0.62)):
    """Eye shader."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()

    node_out  = nodes.new('ShaderNodeOutputMaterial')
    node_bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])

    tex_coord = nodes.new('ShaderNodeTexCoord')
    mapping   = nodes.new('ShaderNodeMapping')
    mapping.name = "PupilMapping"
    links.new(tex_coord.outputs['Generated'], mapping.inputs['Vector'])

    mapping.inputs['Scale'].default_value    = (2.8, 2.8, 2.8)
    mapping.inputs['Location'].default_value = (0.5, 0.0, 0.5)

    grad = nodes.new('ShaderNodeTexGradient')
    grad.gradient_type = 'QUADRATIC_SPHERE'
    links.new(mapping.outputs['Vector'], grad.inputs['Vector'])

    cr = nodes.new('ShaderNodeValToRGB')
    cr.name = "IrisRamp"
    elems = cr.color_ramp.elements

    elems[0].position = 0.0
    elems[0].color    = (0.95, 0.93, 0.90, 1.0)
    e1 = elems.new(0.38)
    e1.color = (0.95, 0.93, 0.90, 1.0)
    e2 = elems.new(0.44)
    e2.color = (0.36, 0.22, 0.54, 1.0)
    e3 = elems.new(0.86)
    e3.color = (0.0, 0.0, 0.0, 1.0)
    elems[-1].position = 1.0
    elems[-1].color    = (0.0, 0.0, 0.0, 1.0)

    links.new(cr.outputs['Color'], node_bsdf.inputs['Base Color'])
    node_bsdf.inputs['Roughness'].default_value  = 0.08
    node_bsdf.inputs['Coat Weight'].default_value = 1.0

    return mat


def create_sclera_material_v6(name):
    """White sclera material."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (1.0, 1.0, 1.0, 1.0)
        bsdf.inputs["Roughness"].default_value = 0.2
        style.set_principled_socket(bsdf, "Specular IOR Level", 0.5)
    return mat

def create_leaf_material_v6(name, color=(0.4, 0.6, 0.2)):
    """Translucent botanical leaf material."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()

    node_bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    node_out = nodes.new('ShaderNodeOutputMaterial')
    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])

    style.set_principled_socket(node_bsdf, "Base Color", (*color, 1))
    style.set_principled_socket(node_bsdf, "Subsurface Weight", 0.5)
    style.set_principled_socket(node_bsdf, "Transmission Weight", 0.2)
    node_bsdf.inputs['Roughness'].default_value = 0.4

    return mat


# ---------------------------------------------------------------------------
# HEAD MATH HELPERS
# ---------------------------------------------------------------------------

def _sphere_surface_y(x_norm, z_norm):
    inner = max(0.0, 1.0 - x_norm ** 2 - z_norm ** 2)
    return -math.sqrt(inner)


def _build_facial_bone_defs(head_r, torso_h, neck_h):
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

    for side in ("L", "R"):
        base = defs[f"Pupil.{side}"][0]
        ch, ct = ctrl(base, offset=(0, 0, 0), tail_offset=(0, -0.05, 0))
        defs[f"Pupil.Ctrl.{side}"] = (ch, ct, f"Pupil.{side}", 'control')

    for side, sx in (("L", 1), ("R", -1)):
        xn = sx * eld_corner_med_x
        h, t = proj(xn, eld_corner_z, tail_len=0.08)
        defs[f"Eyelid.Corner.Med.{side}"] = (h, t, "Head", 'structural')

    for side, sx in (("L", 1), ("R", -1)):
        xn = sx * eld_corner_lat_x
        h, t = proj(xn, eld_corner_z, tail_len=0.08)
        defs[f"Eyelid.Corner.Lat.{side}"] = (h, t, "Head", 'structural')

    for side, sx in (("L", 1), ("R", -1)):
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

    h_tip, t_tip = proj(0.0, nose_z - 0.04, tail_len=0.15)
    defs["Nose.Tip"] = (h_tip, t_tip, "Nose", 'structural')

    for side, sx in (("L", 1), ("R", -1)):
        xn = sx * nose_ala_x
        h_ala, t_ala = proj(xn, nose_ala_z, tail_len=0.10)
        defs[f"Nose.Ala.{side}"] = (h_ala, t_ala, "Nose", 'structural')

    for side in ("L", "R"):
        base_ala = defs[f"Nose.Ala.{side}"][0]
        ch_f, ct_f = ctrl(base_ala, offset=(0, -head_r * 0.02, 0), tail_offset=(0, -head_r * 0.05, 0))
        defs[f"Nose.Flare.{side}"] = (ch_f, ct_f, f"Nose.Ala.{side}", 'control')

    for side, sx in (("L", 1), ("R", -1)):
        xn = sx * lip_corner_x
        h, t = proj(xn, lip_corner_z, tail_len=0.08)
        defs[f"Lip.Corner.{side}"] = (h, t, "Head", 'structural')

    for side, sx in (("L", 1), ("R", -1)):
        base_lc = defs[f"Lip.Corner.{side}"][0]
        ch, ct = ctrl(base_lc, offset=(sx * head_r * 0.03, -head_r * 0.02, 0), tail_offset=(sx * head_r * 0.03, -head_r * 0.05, 0))
        defs[f"Lip.Corner.Ctrl.{side}"] = (ch, ct, f"Lip.Corner.{side}", 'control')

    h_chin, t_chin = proj(chin_x, chin_z, tail_len=0.12)
    defs["Chin"] = (h_chin, t_chin, "Head", 'structural')
    base_chin = defs["Chin"][0]
    ch_jaw, ct_jaw = ctrl(base_chin, offset=(0, head_r * 0.05, -head_r * 0.08), tail_offset=(0, head_r * 0.05, -head_r * 0.14))
    defs["Jaw.Ctrl"] = (ch_jaw, ct_jaw, "Chin", 'control')

    return defs


def _build_armature_v6(name, torso_h, head_r, neck_h):
    armature_data = bpy.data.armatures.new(f"{name}_ArmatureData")
    armature_obj = bpy.data.objects.new(name, armature_data)
    bpy.context.scene.collection.objects.link(armature_obj)
    armature_obj.location = (0,0,0)
    bpy.context.view_layer.objects.active = armature_obj
    bpy.ops.object.mode_set(mode='EDIT')

    bones = {
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
        "Eyelid.Upper.R": ((-head_r*0.35,-head_r*0.84, torso_h+neck_h+head_r*1.40), (-head_r*0.35,-head_r*0.92, torso_h+neck_h+head_r*1.40), "Head"),
        "Eyelid.Lower.R": ((-head_r*0.35,-head_r*0.84, torso_h+neck_h+head_r*1.30), (-head_r*0.35,-head_r*0.92, torso_h+neck_h+head_r*1.30), "Head"),
        "Eyebrow.L": ((head_r*0.35, -head_r*0.81, torso_h+neck_h+head_r*1.45), (head_r*0.4,  -head_r*0.89, torso_h+neck_h+head_r*1.45), "Head"),
        "Eyebrow.R": ((-head_r*0.35,-head_r*0.81, torso_h+neck_h+head_r*1.45), (-head_r*0.4, -head_r*0.89, torso_h+neck_h+head_r*1.45), "Head"),
        "Nose": ((0, -head_r*0.97, torso_h+neck_h+head_r*1.05), (0, -head_r*1.07, torso_h+neck_h+head_r*1.05), "Head"),
        "Lip.Upper": ((0, -head_r*0.96, torso_h+neck_h+head_r*0.82), (0, -head_r*1.06, torso_h+neck_h+head_r*0.82), "Head"),
        "Lip.Lower": ((0, -head_r*0.95, torso_h+neck_h+head_r*0.76), (0, -head_r*1.05, torso_h+neck_h+head_r*0.76), "Head"),
    }

    for bname, (h, t, p) in bones.items():
        bone = armature_data.edit_bones.new(bname)
        bone.head, bone.tail = h, t
        if bname == "Head": bone.roll = math.radians(180)
        if p: bone.parent = armature_data.edit_bones[p]

    facial_defs = _build_facial_bone_defs(head_r, torso_h, neck_h)
    for bname, (h, t, parent_name, btype) in facial_defs.items():
        bone = armature_data.edit_bones.new(bname)
        bone.head, bone.tail = h, t
        if parent_name and parent_name in armature_data.edit_bones:
            bone.parent = armature_data.edit_bones[parent_name]

    bpy.ops.object.mode_set(mode='OBJECT')
    return armature_obj

def _add_weighted_primitive(bm, dlayer, mesh_obj, bname, rad1, rad2, height, loc, rot=(0,0,0), mid_scale=1.0):
    vg = mesh_obj.vertex_groups.get(bname) or mesh_obj.vertex_groups.new(name=bname)
    matrix = (mathutils.Matrix.Translation(loc) @ mathutils.Euler(rot).to_matrix().to_4x4())
    ret = bmesh.ops.create_cone(bm, segments=24, cap_ends=True, radius1=rad1, radius2=rad2, depth=height, matrix=matrix)
    for v in ret['verts']:
        v[dlayer][vg.index] = 1.0
        if mid_scale != 1.0:
            dist = (v.co - mathutils.Vector(loc)).length
            z_fact = 1.0 - abs(dist / (height / 2))
            factor = 1.0 + (mid_scale - 1.0) * max(0, z_fact)
            v.co = mathutils.Vector(loc) + (v.co - mathutils.Vector(loc)) * factor
    return ret

def _add_v6_joint_bulb(bm, dlayer, mesh_obj, loc, rad, bname):
    vg = mesh_obj.vertex_groups.get(bname) or mesh_obj.vertex_groups.new(name=bname)
    matrix = mathutils.Matrix.Translation(loc)
    ret = bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=32, radius=rad, matrix=matrix)
    for v in ret['verts']:
        v[dlayer][vg.index] = 1.0
    return ret

def _build_mesh_v6(name, armature_obj, torso_h, head_r, neck_h):
    mesh_data = bpy.data.meshes.new(f"{name}_MeshData")
    mesh_obj = bpy.data.objects.new(f"{name}_Body", mesh_data)
    bpy.context.scene.collection.objects.link(mesh_obj)
    mesh_obj.parent = armature_obj
    bm = bmesh.new()
    dlayer = bm.verts.layers.deform.verify()

    # 1. TORSO & HEAD
    _add_weighted_primitive(bm, dlayer, mesh_obj, "Torso", 0.5, 0.25, torso_h, (0,0,torso_h/2), mid_scale=1.2)
    _add_v6_joint_bulb(bm, dlayer, mesh_obj, (0, 0, torso_h), 0.18, "Torso")
    _add_weighted_primitive(bm, dlayer, mesh_obj, "Neck", 0.15, 0.12, neck_h, (0, 0, torso_h+neck_h/2))

    matrix_head = mathutils.Matrix.Translation((0, 0, torso_h+neck_h+head_r))
    bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=32, radius=head_r, matrix=matrix_head)
    head_vg = (mesh_obj.vertex_groups.get("Head") or mesh_obj.vertex_groups.new(name="Head"))
    for v in bm.verts:
        if v.co.z > torso_h + neck_h and not v[dlayer].keys():
            v[dlayer][head_vg.index] = 1.0

    # 2. LIMBS
    for side, sx in [("L", 1), ("R", -1)]:
        # Arms
        _add_v6_joint_bulb(bm, dlayer, mesh_obj, (sx*0.4, 0, torso_h*0.9), 0.16, f"Arm.{side}")
        _add_weighted_primitive(bm, dlayer, mesh_obj, f"Arm.{side}", 0.14, 0.11, 0.4, (sx*0.4, 0, torso_h*0.9-0.2), rot=(math.pi/2, 0, 0), mid_scale=1.15)
        _add_v6_joint_bulb(bm, dlayer, mesh_obj, (sx*0.4, 0, torso_h*0.9-0.4), 0.12, f"Elbow.{side}")
        _add_weighted_primitive(bm, dlayer, mesh_obj, f"Elbow.{side}", 0.11, 0.08, 0.4, (sx*0.4, 0, torso_h*0.9-0.6), rot=(math.pi/2, 0, 0), mid_scale=1.1)
        _add_v6_joint_bulb(bm, dlayer, mesh_obj, (sx*0.4, 0, torso_h*0.9-0.8), 0.1, f"Hand.{side}")
        _add_weighted_primitive(bm, dlayer, mesh_obj, f"Hand.{side}", 0.08, 0.12, 0.15, (sx*0.4, 0, torso_h*0.9-0.875), rot=(math.pi/2, 0, 0))

        # Legs
        _add_v6_joint_bulb(bm, dlayer, mesh_obj, (sx*0.25, 0, 0.1), 0.22, f"Thigh.{side}")
        _add_weighted_primitive(bm, dlayer, mesh_obj, f"Thigh.{side}", 0.2, 0.16, 0.5, (sx*0.25, 0, -0.15), rot=(math.pi/2, 0, 0), mid_scale=1.15)
        _add_v6_joint_bulb(bm, dlayer, mesh_obj, (sx*0.25, 0, -0.4), 0.16, f"Knee.{side}")
        _add_weighted_primitive(bm, dlayer, mesh_obj, f"Knee.{side}", 0.16, 0.12, 0.5, (sx*0.25, 0, -0.65), rot=(math.pi/2, 0, 0), mid_scale=1.1)
        _add_v6_joint_bulb(bm, dlayer, mesh_obj, (sx*0.25, 0, -0.9), 0.12, f"Foot.{side}")
        _add_weighted_primitive(bm, dlayer, mesh_obj, f"Foot.{side}", 0.1, 0.15, 0.25, (sx*0.25, -0.075, -0.925), rot=(math.pi/2 + 0.2, 0, 0))

    # 3. FOLIAGE
    foliage_vg = mesh_obj.vertex_groups.get("Foliage") or mesh_obj.vertex_groups.new(name="Foliage")
    head_center = mathutils.Vector((0, 0, torso_h+neck_h+head_r))
    FACE_Y_CLEAR = head_center.y
    for i in range(16):
        angle = (i/16)*6.28
        z_off = random.uniform(head_r*0.4, head_r*0.9)
        loc = head_center + mathutils.Vector((math.cos(angle)*head_r*0.5, math.sin(angle)*head_r*0.5, z_off))
        if loc.y <= FACE_Y_CLEAR: continue
        dir_vec = (loc - head_center).normalized()
        rot_quat = dir_vec.to_track_quat('Z', 'Y')
        b_height = random.uniform(0.3, 0.6)
        b_ret = bmesh.ops.create_cone(bm, segments=8, cap_ends=True, radius1=0.04, radius2=0.01, depth=b_height, matrix=(mathutils.Matrix.Translation(loc + dir_vec*(b_height/2)) @ rot_quat.to_matrix().to_4x4()))
        for v in b_ret['verts']: v[dlayer][head_vg.index] = 1.0
        for j in range(12):
            l_loc = loc + dir_vec * random.uniform(b_height*0.2, b_height)
            l_scale = random.uniform(0.2, 0.45)
            l_m = (mathutils.Matrix.Translation(l_loc) @ mathutils.Euler((random.uniform(0,3), 0, angle)).to_matrix().to_4x4())
            l_ret = bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=l_scale, matrix=l_m)
            for v in l_ret['verts']:
                v[dlayer][head_vg.index] = 1.0
                v[dlayer][foliage_vg.index] = 1.0
                for face in v.link_faces: face.material_index = 1

    # 4. CLEANING & SMOOTHING
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.005)
    for v in bm.verts:
        weights = v[dlayer]
        if len(weights) > 1:
            max_vg = max(weights.keys(), key=lambda k: weights[k])
            for vg_idx in list(weights.keys()):
                if vg_idx != max_vg: v[dlayer][vg_idx] = 0.0
    for _ in range(10): bmesh.ops.smooth_vert(bm, verts=bm.verts, factor=0.7)

    bm.to_mesh(mesh_data); bm.free()
    return mesh_obj

def create_plant_humanoid_v6(name, location, height_scale=1.0, seed=None):
    """Self-contained procedural plant humanoid for Scene 6."""
    if seed is not None: random.seed(seed)
    torso_h = config.PH_TORSO_H * height_scale
    head_r  = config.PH_HEAD_R
    neck_h  = config.PH_NECK_H
    armature_obj = _build_armature_v6(name, torso_h, head_r, neck_h)
    armature_obj.location = location
    mesh_obj = _build_mesh_v6(name, armature_obj, torso_h, head_r, neck_h)
    mesh_obj.modifiers.new(name="Armature", type='ARMATURE').object = armature_obj

    bark_color = (0.2, 0.12, 0.08) if name == config.CHAR_ARBOR else (0.1, 0.15, 0.05)
    leaf_color = (0.6, 0.4, 0.8) if name == config.CHAR_HERBACEOUS else (0.2, 0.6, 0.1)
    mesh_obj.data.materials.append(create_bark_material_v6(f"Bark_{name}", color=bark_color))
    mesh_obj.data.materials.append(create_leaf_material_v6(f"Leaf_{name}", color=leaf_color))

    bones_map = {b.name: b.name for b in armature_obj.data.bones}
    iris_mat = create_iris_material_v6(f"Iris_{name}")
    sclera_mat = create_sclera_material_v6(f"Sclera_{name}")
    bark_mat = create_bark_material_v6(f"FacialBark_{name}", color=bark_color)
    lip_mat = create_lip_material_v6(f"LipMat_{name}")
    create_facial_props_v6(name, armature_obj, bones_map, iris_mat, sclera_mat, bark_mat, lip_mat)
    return armature_obj

import bpy
import bmesh
import mathutils
import math
import random
import os
import sys

# Ensure style_utilities and other movie modules are accessible
V6_DIR = os.path.dirname(os.path.abspath(__file__))
MOVIE_ROOT = os.path.dirname(V6_DIR)
if MOVIE_ROOT not in sys.path:
    sys.path.append(MOVIE_ROOT)

import style_utilities as style
import config
from .facial_v6 import create_facial_props_v6

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
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF") or nodes.get("BSDF_PRINCIPLED")
    if bsdf:
        color_input = bsdf.inputs.get("Base Color") or bsdf.inputs[0]
        color_input.default_value = (0.8, 0.2, 0.3, 1.0)
        bsdf.inputs['Roughness'].default_value = 0.4
    return mat

def setup_production_lighting_v6(subjects):
    """Adds 6-point lighting for full-body isolation."""
    for i, obj in enumerate(subjects):
        armature = obj.parent if obj.parent and obj.parent.type == 'ARMATURE' else None
        base_loc = obj.matrix_world.translation

        rim_name = f"RimLight_{obj.name}"
        if rim_name not in bpy.data.objects:
            loc = (base_loc.x, base_loc.y + 3.0, base_loc.z + 3.0)
            bpy.ops.object.light_add(type='SPOT', location=loc)
            rim = bpy.context.active_object
            rim.name = rim_name
            rim.data.energy = 12000.0; rim.data.spot_size = math.radians(40)
            rim.data.color = (1.0, 0.9, 0.8)
            t = rim.constraints.new(type='TRACK_TO')
            t.target = armature if armature else obj
            if armature: t.subtarget = "Head"
            t.track_axis = 'TRACK_NEGATIVE_Z'; t.up_axis = 'UP_Y'

        key_name = f"HeadKey_{obj.name}"
        if key_name not in bpy.data.objects:
            mid_name = "Lighting_Midpoint"
            if mid_name not in bpy.data.objects:
                mid = bpy.data.objects.new(mid_name, None)
                mid.location = (0, 0, 2.2)
                bpy.context.scene.collection.objects.link(mid)
            else:
                mid = bpy.data.objects.get(mid_name)

            x_side = 3.5 if base_loc.x > 0 else -3.5
            loc = (base_loc.x + x_side, base_loc.y - 6.0, base_loc.z + 2.0)
            bpy.ops.object.light_add(type='SPOT', location=loc)
            key = bpy.context.active_object
            key.name = key_name
            key.data.energy = 10000.0; key.data.spot_size = math.radians(45)
            key.data.color = (0.95, 1.0, 1.0)
            t = key.constraints.new(type='TRACK_TO')
            t.target = mid
            t.track_axis = 'TRACK_NEGATIVE_Z'; t.up_axis = 'UP_Y'

        leg_name = f"LegKey_{obj.name}"
        if leg_name not in bpy.data.objects:
            loc = (obj.location.x * 1.5, obj.location.y - 4.0, 0.5)
            bpy.ops.object.light_add(type='SPOT', location=loc)
            leg = bpy.context.active_object
            leg.name = leg_name
            leg.data.energy = 5000.0; leg.data.spot_size = math.radians(50)
            leg.data.color = (1.0, 1.0, 0.95)
            t = leg.constraints.new(type='TRACK_TO')
            t.target = armature if armature else obj
            if armature: t.subtarget = "Torso"
            t.track_axis = 'TRACK_NEGATIVE_Z'; t.up_axis = 'UP_Y'

def create_iris_material_v6(name, color=(0.36, 0.24, 0.62)):
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
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF") or nodes.get("BSDF_PRINCIPLED")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (1.0, 1.0, 1.0, 1.0)
        bsdf.inputs["Roughness"].default_value = 0.2
        if "Specular IOR Level" in bsdf.inputs:
            bsdf.inputs["Specular IOR Level"].default_value = 0.5
        elif "Specular" in bsdf.inputs:
            bsdf.inputs["Specular"].default_value = 0.5
    return mat

def create_leaf_material_v6(name, color=(0.4, 0.6, 0.2)):
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

def create_plant_humanoid_v6(name, location, height_scale=1.0, seed=None):
    location = mathutils.Vector(location)
    if seed is not None: random.seed(seed)

    # Use Characters collection
    coll = bpy.data.collections.get(config.COLL_CHARACTERS)
    if not coll:
        coll = bpy.data.collections.new(config.COLL_CHARACTERS)
        bpy.context.scene.collection.children.link(coll)

    armature_data = bpy.data.armatures.new(f"{name}_ArmatureData")
    armature_obj = bpy.data.objects.new(name, armature_data)
    coll.objects.link(armature_obj)
    armature_obj.location = location
    bpy.context.view_layer.objects.active = armature_obj
    bpy.ops.object.mode_set(mode='EDIT')

    torso_h = 1.5 * height_scale
    head_r  = 0.4
    neck_h  = 0.2

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
        "Eye.R": ((-head_r*0.35,-head_r*0.84, torso_h+neck_h+head_r*1.35), (-head_r*0.35,-head_r*0.92, torso_h+neck_h+head_r*1.35), "Head"),

        "Eyelid.Upper.L": ((head_r*0.35, -head_r*0.84, torso_h+neck_h+head_r*1.40), (head_r*0.35, -head_r*0.92, torso_h+neck_h+head_r*1.40), "Head"),
        "Eyelid.Lower.L": ((head_r*0.35, -head_r*0.84, torso_h+neck_h+head_r*1.30), (head_r*0.35, -head_r*0.92, torso_h+neck_h+head_r*1.30), "Head"),
        "Eyelid.Upper.R": ((-head_r*0.35,-head_r*0.84, torso_h+neck_h+head_r*1.40), (-head_r*0.35,-head_r*0.92, torso_h+neck_h+head_r*1.40), "Head"),
        "Eyelid.Lower.R": ((-head_r*0.35,-head_r*0.84, torso_h+neck_h+head_r*1.30), (-head_r*0.35,-head_r*0.92, torso_h+neck_h+head_r*1.30), "Head"),

        "Nose": ((0, -head_r*0.97, torso_h+neck_h+head_r*1.05), (0, -head_r*1.07, torso_h+neck_h+head_r*1.05), "Head"),
        "Lip.Upper": ((0, -head_r*0.96, torso_h+neck_h+head_r*0.82), (0, -head_r*1.06, torso_h+neck_h+head_r*0.82), "Head"),
        "Lip.Lower": ((0, -head_r*0.95, torso_h+neck_h+head_r*0.76), (0, -head_r*1.05, torso_h+neck_h+head_r*0.76), "Head"),
    }

    for bname, (h, t, p) in bones.items():
        bone = armature_data.edit_bones.new(bname)
        bone.head, bone.tail = h, t
        if bname == "Head": bone.roll = math.radians(180)
        if p: bone.parent = armature_data.edit_bones[p]

    bpy.ops.object.mode_set(mode='OBJECT')

    mesh_data = bpy.data.meshes.new(f"{name}_MeshData")
    mesh_obj = bpy.data.objects.new(f"{name}_Body", mesh_data)
    coll.objects.link(mesh_obj)
    mesh_obj.parent = armature_obj
    bm = bmesh.new()
    dlayer = bm.verts.layers.deform.verify()

    def add_organic_part(rad1, rad2, height, loc, bname, mid_scale=1.1, rot=(0,0,0)):
        vg = mesh_obj.vertex_groups.get(bname) or mesh_obj.vertex_groups.new(name=bname)
        matrix = (mathutils.Matrix.Translation(loc) @ mathutils.Euler(rot).to_matrix().to_4x4())
        ret = bmesh.ops.create_cone(bm, segments=24, cap_ends=True, radius1=rad1, radius2=rad2, depth=height, matrix=matrix)
        for v in ret['verts']:
            v[dlayer][vg.index] = 1.0
            dist = (v.co - mathutils.Vector(loc)).length
            z_fact = 1.0 - abs(dist / (height / 2))
            factor = 1.0 + (mid_scale - 1.0) * max(0, z_fact)
            v.co = mathutils.Vector(loc) + (v.co - mathutils.Vector(loc)) * factor
        return ret

    def add_joint_bulb(loc, rad, bname):
        vg = mesh_obj.vertex_groups.get(bname) or mesh_obj.vertex_groups.new(name=bname)
        matrix = mathutils.Matrix.Translation(loc)
        ret = bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=16, radius=rad, matrix=matrix)
        for v in ret['verts']: v[dlayer][vg.index] = 1.0

    add_organic_part(0.5, 0.25, torso_h, (0, 0, torso_h/2), "Torso", mid_scale=1.2)
    add_joint_bulb((0, 0, torso_h), 0.18, "Torso")
    add_organic_part(0.15, 0.12, neck_h, (0, 0, torso_h+neck_h/2), "Neck")

    matrix_head = mathutils.Matrix.Translation((0, 0, torso_h+neck_h+head_r))
    bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=32, radius=head_r, matrix=matrix_head)
    head_vg = mesh_obj.vertex_groups.get("Head") or mesh_obj.vertex_groups.new(name="Head")
    for v in bm.verts:
        if v.co.z > torso_h + neck_h: head_vg.add([v.index], 1.0, 'REPLACE')

    for side, mult in (("L", 1), ("R", -1)):
        s_loc = (0.4*mult, 0, torso_h*0.9)
        e_loc = (0.4*mult, 0, torso_h*0.9-0.4)
        h_loc = (0.4*mult, 0, torso_h*0.9-0.8)
        add_joint_bulb(s_loc, 0.16, f"Arm.{side}")
        add_organic_part(0.14, 0.11, 0.4, (s_loc[0], s_loc[1], s_loc[2]-0.2), f"Arm.{side}", mid_scale=1.15)
        add_joint_bulb(e_loc, 0.12, f"Elbow.{side}")
        add_organic_part(0.11, 0.08, 0.4, (e_loc[0], e_loc[1], e_loc[2]-0.2), f"Elbow.{side}", mid_scale=1.1)
        add_joint_bulb(h_loc, 0.1, f"Hand.{side}")
        add_organic_part(0.08, 0.12, 0.15, (h_loc[0], h_loc[1], h_loc[2]-0.07), f"Hand.{side}")

    for side, mult in (("L", 1), ("R", -1)):
        hi_loc = (0.25*mult, 0, 0.1)
        k_loc  = (0.25*mult, 0, -0.4)
        an_loc = (0.25*mult, 0, -0.9)
        add_joint_bulb(hi_loc, 0.22, f"Thigh.{side}")
        add_organic_part(0.2, 0.16, 0.5, (hi_loc[0], hi_loc[1], hi_loc[2]-0.25), f"Thigh.{side}", mid_scale=1.15)
        add_joint_bulb(k_loc, 0.16, f"Knee.{side}")
        add_organic_part(0.16, 0.12, 0.5, (k_loc[0], k_loc[1], k_loc[2]-0.25), f"Knee.{side}", mid_scale=1.1)
        add_joint_bulb(an_loc, 0.12, f"Foot.{side}")
        add_organic_part(0.1, 0.15, 0.25, (an_loc[0], an_loc[1]-0.15, an_loc[2]), f"Foot.{side}", rot=(math.radians(90), 0, 0))

    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.005)
    for _ in range(10): bmesh.ops.smooth_vert(bm, verts=bm.verts, factor=0.7)

    bm.to_mesh(mesh_data)
    bm.free()

    mesh_obj.modifiers.new(name="Armature", type='ARMATURE').object = armature_obj
    mesh_obj.modifiers.new(name="Subsurf", type='SUBSURF').levels = 2

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

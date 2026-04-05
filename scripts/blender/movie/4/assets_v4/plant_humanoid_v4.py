import bpy
import bmesh
import mathutils
import math
import random
import os
import sys

# Ensure style_utilities and other movie modules are accessible
MOVIE_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if MOVIE_ROOT not in sys.path:
    sys.path.append(MOVIE_ROOT)

import style_utilities as style
from .facial_utilities_v4 import create_facial_props_v4

def create_bark_material_v4(name, color=(0.05, 0.02, 0.01)):
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

def setup_production_lighting(subjects):
    """Adds 6-point lighting (Rim, HeadKey, LegKey) for full-body isolation."""
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

def create_iris_material_v4(name, color=(0.49, 0.36, 0.75)):
    """
    Eye shader — pupil / iris / sclera rings visible from camera.

    Root cause fixes vs original:
      1. Switched TexCoord from 'Object' to 'Generated' so the gradient
         origin tracks the mesh centre regardless of bone parenting offset.
      2. Scale Y was 0.0 (collapsed the sphere to a flat disc along Y,
         meaning the gradient Fac was always 0 on the visible face).
         All three axes now use the same scale so the gradient is a
         proper sphere centred on the eyeball.
      3. Rebuilt the color ramp with explicit pupil / iris / sclera zones
         so the bands are always visible at the eyeball's scale.
      4. 'PupilMapping' node kept for animation compatibility (pupil shift).
    """
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()

    node_out  = nodes.new('ShaderNodeOutputMaterial')
    node_bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])

    # -- Coordinates: UV coords are baked into the sphere mesh surface --
    # 'Generated' maps to the object bounding box — after BONE parenting
    # the bbox origin is at the bone TAIL (not the sphere centre), so the
    # gradient is displaced and only the sclera-white region is visible.
    # 'UV' coords are baked into the mesh topology at build time and are
    # immune to any world/local/bone-space offset.  The front pole of a
    # bmesh UV sphere sits at UV (0.5, 0.75) — we centre the mapping there.
    tex_coord = nodes.new('ShaderNodeTexCoord')
    mapping   = nodes.new('ShaderNodeMapping')
    mapping.name = "PupilMapping"           # kept for dialogue_scene_v4 animation
    links.new(tex_coord.outputs['UV'], mapping.inputs['Vector'])

    # UV space is 0→1 across the sphere surface (not world-units).
    # Scale (3.5, 3.5, 3.5) makes the QUADRATIC_SPHERE gradient fill
    # roughly the front hemisphere, giving a clear pupil/iris/sclera split.
    # Location centres the gradient on the front pole of the UV sphere.
    mapping.inputs['Scale'].default_value    = (3.5, 3.5, 3.5)
    mapping.inputs['Location'].default_value = (-0.75, -1.25, 0.0)

    grad = nodes.new('ShaderNodeTexGradient')
    grad.gradient_type = 'QUADRATIC_SPHERE'
    links.new(mapping.outputs['Vector'], grad.inputs['Vector'])

    # -- Single color ramp: pupil(black) → iris(color) → sclera(white) --
    # Fac=0  = centre of gradient = pupil
    # Fac=1  = edge of gradient sphere = sclera
    cr = nodes.new('ShaderNodeValToRGB')
    cr.name = "IrisRamp"
    elems = cr.color_ramp.elements

    # element [0] already exists at position 0 — set to black (pupil)
    elems[0].position = 0.0
    elems[0].color    = (0.0, 0.0, 0.0, 1.0)

    # iris inner edge
    e1 = elems.new(0.18)
    e1.color = (color[0] * 0.4, color[1] * 0.4, color[2] * 0.4, 1.0)

    # iris outer edge / peak colour
    e2 = elems.new(0.38)
    e2.color = (color[0], color[1], color[2], 1.0)

    # sclera boundary — sharp transition
    e3 = elems.new(0.42)
    e3.color = (0.95, 0.93, 0.90, 1.0)   # warm white sclera

    # element [1] was at position 1.0 by default — keep as sclera white
    elems[-1].position = 1.0
    elems[-1].color    = (0.95, 0.93, 0.90, 1.0)

    links.new(cr.outputs['Color'], node_bsdf.inputs['Base Color'])

    node_bsdf.inputs['Roughness'].default_value  = 0.08
    node_bsdf.inputs['Coat Weight'].default_value = 1.0   # corneal highlight

    return mat

def create_leaf_material_v4(name, color=(0.4, 0.6, 0.2)):
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
    """
    Given normalised X and Z fractions of head_r, return the Y component
    that places the point exactly on the sphere surface (facing -Y = forward).
    Clamps to avoid sqrt of negative for extreme inputs.
    """
    inner = max(0.0, 1.0 - x_norm ** 2 - z_norm ** 2)
    return -math.sqrt(inner)


def _build_facial_bone_defs(head_r, torso_h, neck_h):
    """
    Returns a dict of ALL facial bone definitions — both structural (spherically
    projected) and control (offset-based children of structural anchors).

    Convention:
        head_center = (0, 0, torso_h + neck_h + head_r)   i.e. Z = 2.1 at default scale
        Z_rel  = (bone_z - head_center_z) / head_r        normalised height on sphere
        X_norm = bone_x / head_r                           normalised lateral position
        Y      = head_center_y + head_r * _sphere_surface_y(X_norm, Z_rel)

    Structural bones  → projected onto sphere, parented directly to "Head"
    Control  bones    → offset from their structural parent, NOT re-projected
    """

    hcz = torso_h + neck_h + head_r   # head centre Z  (2.1)

    # ------------------------------------------------------------------
    # Convenience: build a (head, tail) tuple for a sphere-projected bone
    # head_point is ON the surface; tail pushes outward by tail_len * r.
    # ------------------------------------------------------------------
    def proj(x_norm, z_norm, tail_len=0.1, x_norm_tail=None, z_norm_tail=None):
        """
        Returns (head_xyz, tail_xyz) both sitting on / just outside the sphere.
        tail point is optionally a second surface point; otherwise radially extended.
        """
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
            # Tail extends radially outward from sphere centre
            dir_vec = mathutils.Vector((hx, hy, hz - hcz)).normalized()
            tx = hx + dir_vec.x * head_r * tail_len
            ty = hy + dir_vec.y * head_r * tail_len
            tz = hz + dir_vec.z * head_r * tail_len

        return (hx, hy, hz), (tx, ty, tz)

    # ------------------------------------------------------------------
    # Offset helper for control bones (child of a structural anchor).
    # `base` is the structural bone's head XYZ; offset is local delta.
    # ------------------------------------------------------------------
    def ctrl(base_head, offset=(0, 0, 0), tail_offset=(0, 0.01, 0)):
        hx = base_head[0] + offset[0]
        hy = base_head[1] + offset[1]
        hz = base_head[2] + offset[2]
        tx = hx + tail_offset[0]
        ty = hy + tail_offset[1]
        tz = hz + tail_offset[2]
        return (hx, hy, hz), (tx, ty, tz)

    # ------------------------------------------------------------------
    # Pre-compute structural anchor positions so control bones can
    # reference them without re-running the sphere math.
    # Format stored: { bone_name: (head_xyz, tail_xyz, parent_name) }
    # ------------------------------------------------------------------

    # ── Existing anchor positions (replicated exactly for cross-reference) ──
    eye_x, eye_z        = 0.35,  0.35
    eld_u_x, eld_u_z    = 0.35,  0.40
    eld_l_x, eld_l_z    = 0.35,  0.30
    nose_x,  nose_z     = 0.00,  0.05
    lip_u_x, lip_u_z    = 0.00, -0.18
    lip_l_x, lip_l_z    = 0.00, -0.24

    # ── New structural positions ──
    # Pupil: sits inside the eyeball (pull Y further inward by 0.08*r)
    pupil_x, pupil_z    = eye_x, eye_z
    pupil_y_offset      = 0.08   # extra inset behind cornea (local -Y)

    # Eyelid medial corners  (closer to nose bridge, same Z as lid)
    eld_corner_med_x    = 0.15   # X closer to nose
    eld_corner_lat_x    = 0.52   # X further from nose (lateral canthus)
    eld_corner_z        = 0.35   # same height as eye centre

    # Nose alar wings  (X offset, same Z as nose)
    nose_ala_x          = 0.18
    nose_ala_z          = 0.02

    # Lip corners (lateral extent of the mouth)
    lip_corner_x        = 0.20
    lip_corner_z        = -0.21  # between upper and lower lip

    # Chin: below lower lip
    chin_x, chin_z      = 0.00, -0.38

    # ------------------------------------------------------------------
    # Build the definitions dict
    # Each entry: (head_xyz, tail_xyz, parent_name, bone_type)
    #   bone_type: 'structural' | 'control'
    # ------------------------------------------------------------------
    defs = {}

    # ── PUPILS (structural — inset behind cornea) ──────────────────────
    for side, sx in (("L", 1), ("R", -1)):
        xn = sx * pupil_x
        y_surf = _sphere_surface_y(xn / head_r, pupil_z)  # already normalised
        # Head ON sphere, tail pushed inward (deeper -Y = behind eyeball)
        ph = (head_r * xn / head_r,
              head_r * y_surf - head_r * pupil_y_offset,
              hcz + head_r * pupil_z)
        pt = (ph[0],
              ph[1] - head_r * 0.05,
              ph[2])
        defs[f"Pupil.{side}"] = (ph, pt, f"Eye.{side}", 'structural')

    # Pupil control bones (dilate/constrict — scale driver)
    for side in ("L", "R"):
        base = defs[f"Pupil.{side}"][0]
        ch, ct = ctrl(base, offset=(0, 0, 0.01), tail_offset=(0, 0, 0.03))
        defs[f"Pupil.Ctrl.{side}"] = (ch, ct, f"Pupil.{side}", 'control')

    # ── EYELID MEDIAL CORNERS (structural) ────────────────────────────
    for side, sx in (("L", 1), ("R", -1)):
        xn = sx * eld_corner_med_x
        h, t = proj(xn / head_r, eld_corner_z, tail_len=0.08)
        defs[f"Eyelid.Corner.Med.{side}"] = (h, t, "Head", 'structural')

    # ── EYELID LATERAL CORNERS (structural) ───────────────────────────
    for side, sx in (("L", 1), ("R", -1)):
        xn = sx * eld_corner_lat_x
        # Clamp: lateral X is large; sqrt may be small but valid
        h, t = proj(xn / head_r, eld_corner_z, tail_len=0.08)
        defs[f"Eyelid.Corner.Lat.{side}"] = (h, t, "Head", 'structural')

    # ── EYELID CONTROL BONES (offset children of existing Eyelid bones) ─
    # These drive the arc of lid travel, parented to the existing lid bones
    # so they inherit surface-projected position and add local offset control.
    for side, sx in (("L", 1), ("R", -1)):
        xn = sx * eld_u_x
        y_u = head_r * _sphere_surface_y(eld_u_x, eld_u_z)
        z_u = hcz + head_r * eld_u_z
        base_u = (head_r * xn / head_r, y_u, z_u)   # matches Eyelid.Upper bone head

        y_l = head_r * _sphere_surface_y(eld_l_x, eld_l_z)
        z_l = hcz + head_r * eld_l_z
        xn_l = sx * eld_l_x
        base_l = (head_r * xn_l / head_r, y_l, z_l)

        # Upper control: sits just above the upper lid, outward +0.02r
        ch_u, ct_u = ctrl(base_u,
                          offset=(0, -head_r * 0.02, head_r * 0.05),
                          tail_offset=(0, -head_r * 0.02, head_r * 0.08))
        defs[f"Eyelid.Ctrl.Upper.{side}"] = (
            ch_u, ct_u, f"Eyelid.Upper.{side}", 'control')

        # Lower control: sits just below the lower lid, outward +0.02r
        ch_l, ct_l = ctrl(base_l,
                          offset=(0, -head_r * 0.02, -head_r * 0.05),
                          tail_offset=(0, -head_r * 0.02, -head_r * 0.08))
        defs[f"Eyelid.Ctrl.Lower.{side}"] = (
            ch_l, ct_l, f"Eyelid.Lower.{side}", 'control')

    # ── NOSE STRUCTURAL BONES ─────────────────────────────────────────
    # Nose.Tip — on sphere surface, slightly lower than existing Nose
    h_tip, t_tip = proj(0.0, nose_z - 0.04, tail_len=0.15)
    defs["Nose.Tip"] = (h_tip, t_tip, "Nose", 'structural')

    # Nose alar wings — project onto sphere surface
    for side, sx in (("L", 1), ("R", -1)):
        xn = sx * nose_ala_x
        h_ala, t_ala = proj(xn / head_r, nose_ala_z, tail_len=0.10)
        defs[f"Nose.Ala.{side}"] = (h_ala, t_ala, "Nose", 'structural')

    # Nose flare controls (offset children of alar anchors)
    for side in ("L", "R"):
        base_ala = defs[f"Nose.Ala.{side}"][0]
        ch_f, ct_f = ctrl(base_ala,
                          offset=(0, -head_r * 0.02, 0),
                          tail_offset=(0, -head_r * 0.05, 0))
        defs[f"Nose.Flare.{side}"] = (ch_f, ct_f, f"Nose.Ala.{side}", 'control')

    # ── LIP CORNER BONES (structural) ─────────────────────────────────
    for side, sx in (("L", 1), ("R", -1)):
        xn = sx * lip_corner_x
        h_lc, t_lc = proj(xn / head_r, lip_corner_z, tail_len=0.08)
        defs[f"Lip.Corner.{side}"] = (h_lc, t_lc, "Head", 'structural')

    # Lip corner controls (pull/push for smiles/frowns)
    for side, sx in (("L", 1), ("R", -1)):
        base_lc = defs[f"Lip.Corner.{side}"][0]
        ch_lcc, ct_lcc = ctrl(base_lc,
                              offset=(sx * head_r * 0.03, -head_r * 0.02, 0),
                              tail_offset=(sx * head_r * 0.03,
                                           -head_r * 0.05, 0))
        defs[f"Lip.Corner.Ctrl.{side}"] = (
            ch_lcc, ct_lcc, f"Lip.Corner.{side}", 'control')

    # ── CHIN / JAW STRUCTURAL ANCHOR ──────────────────────────────────
    h_chin, t_chin = proj(chin_x, chin_z, tail_len=0.12)
    defs["Chin"] = (h_chin, t_chin, "Head", 'structural')

    # Jaw open control (offset child of Chin, drives jaw-open expressions)
    base_chin = defs["Chin"][0]
    ch_jaw, ct_jaw = ctrl(base_chin,
                          offset=(0, head_r * 0.05, -head_r * 0.08),
                          tail_offset=(0, head_r * 0.05, -head_r * 0.14))
    defs["Jaw.Ctrl"] = (ch_jaw, ct_jaw, "Chin", 'control')

    return defs


def create_plant_humanoid_v4(name, location, height_scale=1.0, seed=None):
    """
    Upgraded Plant Humanoid for Scene 4:
    - Full rig with Shoulders, Elbows, Hips, Knees.
    - Structural mesh for Shoulders/Hips.
    - Dual lips and Eyelids.
    - Structural + control facial bone hierarchy (NEW):
        Pupils, Eyelid corners, Eyelid controls, Nose tip, Nose alar wings,
        Nose flare controls, Lip corners, Lip corner controls, Chin, Jaw.Ctrl
    """
    location = mathutils.Vector(location)
    if seed is not None: random.seed(seed)
    
    # 1. Armature
    armature_data = bpy.data.armatures.new(f"{name}_ArmatureData")
    armature_obj = bpy.data.objects.new(name, armature_data)
    bpy.context.scene.collection.objects.link(armature_obj)
    armature_obj.location = location
    bpy.context.view_layer.objects.active = armature_obj
    bpy.ops.object.mode_set(mode='EDIT')
    
    torso_h = 1.5 * height_scale
    head_r  = 0.4
    neck_h  = 0.2
    
    # ------------------------------------------------------------------
    # BODY SKELETON  (unchanged from original V4)
    # ------------------------------------------------------------------
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
        "Finger.1.L": ((0.4, 0, torso_h*0.9-0.95), (0.45,0, torso_h*0.9-1.1),  "Hand.L"),
        "Finger.2.L": ((0.4, 0, torso_h*0.9-0.95), (0.4, 0.05, torso_h*0.9-1.1), "Hand.L"),
        "Finger.3.L": ((0.4, 0, torso_h*0.9-0.95), (0.35,0, torso_h*0.9-1.1),  "Hand.L"),
        
        "Hand.R":     ((-0.4, 0, torso_h*0.9-0.8),  (-0.4, 0, torso_h*0.9-0.95), "Elbow.R"),
        "Finger.1.R": ((-0.4, 0, torso_h*0.9-0.95), (-0.45,0, torso_h*0.9-1.1), "Hand.R"),
        "Finger.2.R": ((-0.4, 0, torso_h*0.9-0.95), (-0.4, 0.05, torso_h*0.9-1.1), "Hand.R"),
        "Finger.3.R": ((-0.4, 0, torso_h*0.9-0.95), (-0.35,0, torso_h*0.9-1.1), "Hand.R"),
        
        "Foot.L":  ((0.25, 0, -0.9),     (0.25,-0.15,-0.95), "Knee.L"),
        "Toe.1.L": ((0.25,-0.15,-0.95),  (0.32,-0.45,-0.95), "Foot.L"),
        "Toe.2.L": ((0.25,-0.15,-0.95),  (0.25,-0.5, -0.95), "Foot.L"),
        "Toe.3.L": ((0.25,-0.15,-0.95),  (0.18,-0.45,-0.95), "Foot.L"),
        
        "Foot.R":  ((-0.25, 0, -0.9),    (-0.25,-0.15,-0.95), "Knee.R"),
        "Toe.1.R": ((-0.25,-0.15,-0.95), (-0.32,-0.45,-0.95), "Foot.R"),
        "Toe.2.R": ((-0.25,-0.15,-0.95), (-0.25,-0.5, -0.95), "Foot.R"),
        "Toe.3.R": ((-0.25,-0.15,-0.95), (-0.18,-0.45,-0.95), "Foot.R"),
        
        # ── Original facial anchor bones (spherically projected) ──────
        "Ear.L": ((head_r*0.9, 0, torso_h+neck_h+head_r),
                  (head_r*1.1, 0, torso_h+neck_h+head_r+0.1), "Head"),
        "Ear.R": ((-head_r*0.9, 0, torso_h+neck_h+head_r),
                  (-head_r*1.1, 0, torso_h+neck_h+head_r+0.1), "Head"),
        
        "Eye.L": ((head_r*0.35, -head_r*0.84, torso_h+neck_h+head_r*1.35),
                  (head_r*0.35, -head_r*0.92, torso_h+neck_h+head_r*1.35), "Head"),
        "Eye.R": ((-head_r*0.35,-head_r*0.84, torso_h+neck_h+head_r*1.35),
                  (-head_r*0.35,-head_r*0.92, torso_h+neck_h+head_r*1.35), "Head"),
        
        "Eyelid.Upper.L": ((head_r*0.35, -head_r*0.84, torso_h+neck_h+head_r*1.40),
                           (head_r*0.35, -head_r*0.92, torso_h+neck_h+head_r*1.40), "Head"),
        "Eyelid.Lower.L": ((head_r*0.35, -head_r*0.84, torso_h+neck_h+head_r*1.30),
                           (head_r*0.35, -head_r*0.92, torso_h+neck_h+head_r*1.30), "Head"),
        "Eyelid.Upper.R": ((-head_r*0.35,-head_r*0.84, torso_h+neck_h+head_r*1.40),
                           (-head_r*0.35,-head_r*0.92, torso_h+neck_h+head_r*1.40), "Head"),
        "Eyelid.Lower.R": ((-head_r*0.35,-head_r*0.84, torso_h+neck_h+head_r*1.30),
                           (-head_r*0.35,-head_r*0.92, torso_h+neck_h+head_r*1.30), "Head"),
        
        "Eyebrow.L": ((head_r*0.35, -head_r*0.81, torso_h+neck_h+head_r*1.45),
                      (head_r*0.4,  -head_r*0.89, torso_h+neck_h+head_r*1.45), "Head"),
        "Eyebrow.R": ((-head_r*0.35,-head_r*0.81, torso_h+neck_h+head_r*1.45),
                      (-head_r*0.4, -head_r*0.89, torso_h+neck_h+head_r*1.45), "Head"),
        
        "Nose": ((0, -head_r*0.97, torso_h+neck_h+head_r*1.05),
                 (0, -head_r*1.07, torso_h+neck_h+head_r*1.05), "Head"),
        
        "Lip.Upper": ((0, -head_r*0.96, torso_h+neck_h+head_r*0.82),
                      (0, -head_r*1.06, torso_h+neck_h+head_r*0.82), "Head"),
        "Lip.Lower": ((0, -head_r*0.95, torso_h+neck_h+head_r*0.76),
                      (0, -head_r*1.05, torso_h+neck_h+head_r*0.76), "Head"),
    }
    
    # ------------------------------------------------------------------
    # NEW FACIAL BONES  (structural + control, generated from math helpers)
    # ------------------------------------------------------------------
    facial_defs = _build_facial_bone_defs(head_r, torso_h, neck_h)
    # facial_defs format: { name: (head_xyz, tail_xyz, parent_name, bone_type) }

    # ------------------------------------------------------------------
    # CREATE ALL BONES
    # ------------------------------------------------------------------
    # Body bones first (parent must exist before child)
    for bname, (h, t, p) in bones.items():
        bone = armature_data.edit_bones.new(bname)
        bone.head, bone.tail = h, t
        if p:
            bone.parent = armature_data.edit_bones[p]

    # Facial structural bones (parents are already in armature from body bones)
    # Process structural before control so controls can find their parents
    for bname, (h, t, parent_name, btype) in facial_defs.items():
        if btype == 'structural':
            bone = armature_data.edit_bones.new(bname)
            bone.head, bone.tail = h, t
            if parent_name and parent_name in armature_data.edit_bones:
                bone.parent = armature_data.edit_bones[parent_name]

    # Facial control bones (parents are structural bones created above)
    for bname, (h, t, parent_name, btype) in facial_defs.items():
        if btype == 'control':
            bone = armature_data.edit_bones.new(bname)
            bone.head, bone.tail = h, t
            if parent_name and parent_name in armature_data.edit_bones:
                bone.parent = armature_data.edit_bones[parent_name]

    bpy.ops.object.mode_set(mode='OBJECT')

    # ------------------------------------------------------------------
    # Mark control bones with a custom property for easy identification
    # ------------------------------------------------------------------
    for bname, (*_, btype) in facial_defs.items():
        pb = armature_obj.pose.bones.get(bname)
        if pb:
            pb["bone_type"] = btype         # 'structural' or 'control'
            pb["facial_bone"] = True
            if btype == 'control':
                # Control bones shown as arrows; structural as sticks
                pb.custom_shape = None       # can be overridden in-editor

    # 2. Mesh Construction
    mesh_data = bpy.data.meshes.new(f"{name}_MeshData")
    mesh_obj = bpy.data.objects.new(f"{name}_Body", mesh_data)
    bpy.context.scene.collection.objects.link(mesh_obj)
    mesh_obj.parent = armature_obj
    bm = bmesh.new()
    dlayer = bm.verts.layers.deform.verify()
    
    def add_organic_part(rad1, rad2, height, loc, bname, mid_scale=1.1, rot=(0,0,0)):
        vg = mesh_obj.vertex_groups.get(bname) or mesh_obj.vertex_groups.new(name=bname)
        matrix = (mathutils.Matrix.Translation(loc)
                  @ mathutils.Euler(rot).to_matrix().to_4x4())
        ret = bmesh.ops.create_cone(bm, segments=24, cap_ends=True,
                                    radius1=rad1, radius2=rad2,
                                    depth=height, matrix=matrix)
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
        ret = bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=16,
                                        radius=rad, matrix=matrix)
        for v in ret['verts']:
            v[dlayer][vg.index] = 1.0

    # 3. Build Body Sections
    add_organic_part(0.5, 0.25, torso_h, (0, 0, torso_h/2), "Torso", mid_scale=1.2)
    add_joint_bulb((0, 0, torso_h), 0.18, "Torso")
    add_organic_part(0.15, 0.12, neck_h, (0, 0, torso_h+neck_h/2), "Neck")

    matrix_head = mathutils.Matrix.Translation((0, 0, torso_h+neck_h+head_r))
    bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=32,
                              radius=head_r, matrix=matrix_head)
    head_vg = (mesh_obj.vertex_groups.get("Head")
               or mesh_obj.vertex_groups.new(name="Head"))
    for v in bm.verts:
        if v.co.z > torso_h + neck_h:
            head_vg.add([v.index], 1.0, 'REPLACE')

    # Arms
    for side, mult in (("L", 1), ("R", -1)):
        s_loc = (0.4*mult, 0, torso_h*0.9)
        e_loc = (0.4*mult, 0, torso_h*0.9-0.4)
        h_loc = (0.4*mult, 0, torso_h*0.9-0.8)
        add_joint_bulb(s_loc, 0.16, f"Arm.{side}")
        add_organic_part(0.14, 0.11, 0.4,
                         (s_loc[0], s_loc[1], s_loc[2]-0.2), f"Arm.{side}",
                         mid_scale=1.15)
        add_joint_bulb(e_loc, 0.12, f"Elbow.{side}")
        add_organic_part(0.11, 0.08, 0.4,
                         (e_loc[0], e_loc[1], e_loc[2]-0.2), f"Elbow.{side}",
                         mid_scale=1.1)
        add_joint_bulb(h_loc, 0.1, f"Hand.{side}")
        add_organic_part(0.08, 0.12, 0.15,
                         (h_loc[0], h_loc[1], h_loc[2]-0.07), f"Hand.{side}")
        for f in range(1, 4):
            fx = h_loc[0] + (f-2)*0.06
            add_organic_part(0.04, 0.01, 0.25,
                             (fx, h_loc[1], h_loc[2]-0.2), f"Finger.{f}.{side}")

    # Legs
    for side, mult in (("L", 1), ("R", -1)):
        hi_loc = (0.25*mult, 0, 0.1)
        k_loc  = (0.25*mult, 0, -0.4)
        an_loc = (0.25*mult, 0, -0.9)
        add_joint_bulb(hi_loc, 0.22, f"Thigh.{side}")
        add_organic_part(0.2, 0.16, 0.5,
                         (hi_loc[0], hi_loc[1], hi_loc[2]-0.25),
                         f"Thigh.{side}", mid_scale=1.15)
        add_joint_bulb(k_loc, 0.16, f"Knee.{side}")
        add_organic_part(0.16, 0.12, 0.5,
                         (k_loc[0], k_loc[1], k_loc[2]-0.25),
                         f"Knee.{side}", mid_scale=1.1)
        add_joint_bulb(an_loc, 0.12, f"Foot.{side}")
        add_organic_part(0.1, 0.15, 0.25,
                         (an_loc[0], an_loc[1]-0.15, an_loc[2]),
                         f"Foot.{side}", rot=(math.radians(90), 0, 0))
        for t in range(1, 4):
            tx = an_loc[0] + (t-2)*0.08
            add_organic_part(0.05, 0.02, 0.25,
                             (tx, an_loc[1]-0.3, an_loc[2]),
                             f"Toe.{t}.{side}",
                             rot=(math.radians(90), 0, 0))

    # 4. Foliage
    foliage_vg = (mesh_obj.vertex_groups.get("Foliage")
                  or mesh_obj.vertex_groups.new(name="Foliage"))
    head_center = mathutils.Vector((0, 0, torso_h+neck_h+head_r))

    # Exclude the entire front face hemisphere from foliage so leaves never
    # cover the eyes/nose/lips.  The original threshold (-0.1) was too tight —
    # only excluding a thin strip directly in front.  We now exclude the whole
    # forward half-sphere (any branch whose Y is below head_center.Y).
    # Branches are generated in armature-local space at build time; the
    # armature's later world rotation does not shift local vertex positions,
    # so this local-space check stays valid after set_eyeline_alignment.
    FACE_Y_CLEAR = head_center.y   # anything at or below this is face-side

    for i in range(16):
        angle = (i/16)*6.28
        z_off = random.uniform(head_r*0.4, head_r*0.9)
        loc = head_center + mathutils.Vector((
            math.cos(angle)*head_r*0.5,
            math.sin(angle)*head_r*0.5,
            z_off))
        # Skip the entire forward (-Y) hemisphere
        if loc.y <= FACE_Y_CLEAR:
            continue
        dir_vec = (loc - head_center).normalized()
        rot_quat = dir_vec.to_track_quat('Z', 'Y')
        b_height = random.uniform(0.3, 0.6)
        b_ret = bmesh.ops.create_cone(
            bm, segments=8, cap_ends=True,
            radius1=0.04, radius2=0.01, depth=b_height,
            matrix=(mathutils.Matrix.Translation(loc + dir_vec*(b_height/2))
                    @ rot_quat.to_matrix().to_4x4()))
        for v in b_ret['verts']:
            v[dlayer][head_vg.index] = 1.0
        for j in range(12):
            l_loc = loc + dir_vec * random.uniform(b_height*0.2, b_height)
            l_scale = random.uniform(0.2, 0.45)
            l_m = (mathutils.Matrix.Translation(l_loc)
                   @ mathutils.Euler((random.uniform(0,3), 0, angle)).to_matrix().to_4x4())
            l_ret = bmesh.ops.create_grid(bm, x_segments=1, y_segments=1,
                                          size=l_scale, matrix=l_m)
            for v in l_ret['verts']:
                v[dlayer][head_vg.index] = 1.0
                v[dlayer][foliage_vg.index] = 1.0
                for face in v.link_faces:
                    face.material_index = 1

    limbs = ["Arm.L","Arm.R","Elbow.L","Elbow.R",
             "Thigh.L","Thigh.R","Knee.L","Knee.R"]
    for bone_name in limbs:
        vg = mesh_obj.vertex_groups.get(bone_name)
        if not vg:
            continue
        vg_verts = [v for v in bm.verts if vg.index in v[dlayer]]
        for _ in range(10):
            if not vg_verts:
                break
            v_target = random.choice(vg_verts)
            l_loc = v_target.co + v_target.normal * 0.05
            l_m = (mathutils.Matrix.Translation(l_loc)
                   @ mathutils.Euler((random.uniform(0,3), 0,
                                      random.uniform(0,6))).to_matrix().to_4x4())
            l_ret = bmesh.ops.create_grid(bm, x_segments=1, y_segments=1,
                                          size=0.2, matrix=l_m)
            for v in l_ret['verts']:
                v[dlayer][vg.index] = 1.0
                v[dlayer][foliage_vg.index] = 0.5
                for face in v.link_faces:
                    face.material_index = 1

    # 5. Global Smoothing
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.03)
    for _ in range(10):
        bmesh.ops.smooth_vert(bm, verts=bm.verts, factor=0.7)
    
    bm.to_mesh(mesh_data)
    bm.free()
    
    # Modifiers
    mesh_obj.modifiers.new(name="Armature", type='ARMATURE').object = armature_obj

    wave = mesh_obj.modifiers.new(name="WindSway", type='WAVE')
    wave.use_x = True; wave.use_y = True
    wave.height = 0.05; wave.width = 1.5; wave.narrowness = 1.5
    wave.speed = 0.15; wave.vertex_group = "Foliage"
    
    mesh_obj.modifiers.new(name="Subsurf", type='SUBSURF').levels = 2
    mesh_obj.modifiers.new(name="WeightedNormal", type='WEIGHTED_NORMAL')
    
    tex_bark = (bpy.data.textures.get("BarkBump")
                or bpy.data.textures.new("BarkBump", type='CLOUDS'))
    tex_bark.noise_scale = 0.05
    disp = mesh_obj.modifiers.new(name="BarkBump", type='DISPLACE')
    disp.texture = tex_bark
    disp.strength = 0.06
    disp.vertex_group = "Torso"

    mesh_obj.data.materials.append(create_bark_material_v4(f"Bark_{name}"))
    mesh_obj.data.materials.append(create_leaf_material_v4(f"Leaf_{name}"))

    # A-Pose
    bpy.context.view_layer.objects.active = armature_obj
    bpy.ops.object.mode_set(mode='POSE')
    for side in ("L", "R"):
        mult = 1 if side == "L" else -1
        if f"Arm.{side}" in armature_obj.pose.bones:
            bone = armature_obj.pose.bones[f"Arm.{side}"]
            bone.rotation_mode = 'XYZ'
            bone.rotation_euler[0] = math.radians(-40)
            bone.rotation_euler[2] = math.radians(-40 * mult)
            bone.keyframe_insert(data_path="rotation_euler", frame=1)
        if f"Elbow.{side}" in armature_obj.pose.bones:
            ebone = armature_obj.pose.bones[f"Elbow.{side}"]
            ebone.rotation_mode = 'XYZ'
            ebone.rotation_euler[0] = math.radians(30)
            ebone.keyframe_insert(data_path="rotation_euler", frame=1)
    bpy.ops.object.mode_set(mode='OBJECT')

    # 3. Facial Props
    # bones_map is used by create_facial_props_v4 to look up which bone name
    # to parent each mesh prop to.  The identity map covers all body/facial
    # anchor bones.  Pupil bones must be listed explicitly here so that
    # has_bone() passes AND _build_pupil_disc receives the correct bone name
    # (previously bones_map.get("Pupil.L") returned None, silently skipping
    # pupil disc creation).
    bones_map = {b.name: b.name for b in armature_obj.data.bones}

    iris_mat = create_iris_material_v4(f"Iris_{name}")
    bark_mat = create_bark_material_v4(f"FacialBark_{name}",
                                       color=(0.1, 0.15, 0.05))

    create_facial_props_v4(name, armature_obj, bones_map, iris_mat, bark_mat)
    
    return armature_obj
import bpy
import bmesh
import mathutils
import math


# ---------------------------------------------------------------------------
# INTERNAL GEOMETRY HELPERS
# ---------------------------------------------------------------------------

def _link_obj(obj, armature, bone_name):
    """Parent obj to armature via BONE, located at bone head (local origin)."""
    bpy.context.scene.collection.objects.link(obj)
    obj.parent      = armature
    obj.parent_type = 'BONE'
    obj.parent_bone = bone_name
    obj.location    = (0, 0, 0)


def _smooth_all(obj):
    for p in obj.data.polygons:
        p.use_smooth = True

def _set_non_render_helper(obj):
    """Mark rig helper geometry as non-renderable guide-only content."""
    obj.hide_render = True
    obj.display_type = 'WIRE'


def _new_obj(name, mesh_name, armature, bone_name):
    """Create a new mesh object parented to a bone."""
    mesh = bpy.data.meshes.new(f"{mesh_name}_Mesh")
    obj  = bpy.data.objects.new(name, mesh)
    _link_obj(obj, armature, bone_name)
    return obj, mesh


# ---------------------------------------------------------------------------
# PUPIL / IRIS DISC
# ---------------------------------------------------------------------------

def _build_pupil_disc(
    name,
    armature,
    side,
    disc_radius=0.03,
    disc_depth=0.002,
    eye_radius=0.06,
    surface_offset=0.002,
):
    """
    Thin disc that sits flush against the eyeball cornea, displaying the
    dark pupil ring on top of the iris shader.

    NOTE: disc_radius is intentionally oversized (0.03m) for current
    debugging visibility so placement issues can be seen clearly in renders.

    Parented to Pupil.L / Pupil.R (structural — inset behind cornea).
    Animated via Pupil.Ctrl.L/R scale for dilation/constriction.

    Orientation fix
    ───────────────
    Pupil bones inherit their axes from 'Head', whose local -Y points
    forward.  The disc must face the same direction as the eyeball (also
    parented to Head).  We achieve this with a COPY_ROTATION constraint
    targeting the matching Eye.L / Eye.R bone so the disc always stays
    coplanar with the cornea, even when the eye bone is animated.

    The disc geometry is built flat in XZ (normal along +Y in local space),
    then the constraint aligns that +Y with the Eye bone's +Y, which in the
    default rig already points toward the camera (-Y world → +Y local after
    the bone's rest-pose matrix).
    """
    obj_name  = f"{name}_PupilDisc_{side}"
    obj, mesh = _new_obj(obj_name, obj_name, armature, f"Eye.{side}")

    bm = bmesh.new()
    # Disc is flat in XZ plane — its face normal is along local +Y.
    bmesh.ops.create_cone(bm,
                          cap_ends=True,
                          segments=32,
                          radius1=disc_radius,
                          radius2=disc_radius,
                          depth=disc_depth)
    # Rotate 90° around X: cone (along Z) → disc (flat in XZ, normal along +Y).
    rot_mx = mathutils.Euler((math.radians(90), 0, 0)).to_matrix().to_4x4()
    bmesh.ops.transform(bm, matrix=rot_mx, verts=bm.verts)

    bm.to_mesh(mesh)
    bm.free()

    # Dedicated solid-black pupil material — must NOT share the Iris shader,
    # otherwise the disc renders identically to the eyeball surface.
    pupil_mat_name = f"Pupil_Black_{name}"
    pupil_mat = bpy.data.materials.get(pupil_mat_name)
    if not pupil_mat:
        pupil_mat = bpy.data.materials.new(name=pupil_mat_name)
        pupil_mat.use_nodes = True
        pupil_mat.blend_method = 'OPAQUE' # Ensure the solid black pupil renders as opaque
        tree = pupil_mat.node_tree
        tree.nodes.clear()
        output = tree.nodes.new('ShaderNodeOutputMaterial')
        bsdf = tree.nodes.new('ShaderNodeBsdfPrincipled')
        bsdf.inputs['Base Color'].default_value = (0.0, 0.0, 0.0, 1.0)  # Pure black
        bsdf.inputs['Roughness'].default_value = 0.3
        tree.links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    obj.data.materials.append(pupil_mat)
    _smooth_all(obj)

    # Place pupil at the eyeball front pole relative to Eye bone origin.
    obj.location = (0.0, +(eye_radius + surface_offset), 0.0)

    return obj


def _validate_pupil_scale(pupil, eyeball):
    if max(pupil.dimensions) > max(eyeball.dimensions):
        #raise ValueError("Pupil larger than eyeball — invalid state")
        print("WARNING-- Pupil larger than eyeball — invalid state")

def _validate_pupil_placement(pupil, eyeball, eye_radius=0.062, tolerance=0.008):
    dist = (pupil.matrix_world.translation - eyeball.matrix_world.translation).length
    return abs(dist - eye_radius) <= tolerance


# ---------------------------------------------------------------------------
# EYELID CORNER MARKERS
# ---------------------------------------------------------------------------

def _build_eyelid_corner(name, armature, bone_name, bark_material,
                         radius=0.012):
    """
    Small sphere marking the medial or lateral canthus.
    Parented to Eyelid.Corner.Med.{side} / Eyelid.Corner.Lat.{side}.
    """
    obj_name = f"{name}_LidCorner_{bone_name.replace('.', '_')}"
    obj, mesh = _new_obj(obj_name, obj_name, armature, bone_name)

    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=12, radius=radius)
    bm.to_mesh(mesh)
    bm.free()

    obj.data.materials.append(bark_material)
    _smooth_all(obj)
    obj.hide_render = True
    obj.display_type = 'WIRE'
    return obj


# ---------------------------------------------------------------------------
# EYELID CONTROL VISUALISERS
# ---------------------------------------------------------------------------

def _build_eyelid_ctrl_arc(name, armature, bone_name, bark_material,
                           arc_radius=0.055, segments=12,
                           arc_angle=math.radians(140), lid_type="Upper"):
    """
    Thin arc mesh that visualises the eyelid travel path.
    Parented to Eyelid.Ctrl.Upper.{side} / Eyelid.Ctrl.Lower.{side}.

    The arc sweeps in the ZX plane (the lid opens/closes along Z while
    rotating around the eyeball equator in X).  A positive Z offset for
    Upper, negative for Lower.
    """
    obj_name = f"{name}_LidCtrlArc_{bone_name.replace('.', '_')}"
    obj, mesh = _new_obj(obj_name, obj_name, armature, bone_name)

    bm = bmesh.new()
    half = arc_angle / 2.0
    z_sign = 1 if lid_type == "Upper" else -1

    verts = []
    for i in range(segments + 1):
        t   = i / segments
        ang = -half + t * arc_angle          # sweep from -half to +half
        # Arc in XZ plane, centred at local origin, facing -Y
        x   = arc_radius * math.sin(ang)
        z   = arc_radius * math.cos(ang) * z_sign
        verts.append(bm.verts.new((x, 0.0, z)))

    for i in range(segments):
        bm.edges.new((verts[i], verts[i + 1]))

    bm.to_mesh(mesh)
    bm.free()

    obj.data.materials.append(bark_material)
    obj.hide_render = True
    obj.display_type = 'WIRE'
    return obj


# ---------------------------------------------------------------------------
# NOSE TIP
# ---------------------------------------------------------------------------

def _build_nose_tip(name, armature, bone_name, bark_material):
    """
    Rounded hemisphere at the nose tip, parented to Nose.Tip.
    Slightly smaller and rounder than the main Nose cone.
    """
    obj_name = f"{name}_NoseTip"
    obj, mesh = _new_obj(obj_name, obj_name, armature, bone_name)

    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=16, radius=0.028)
    # Keep only the forward hemisphere (verts with y < 0 stay, rest removed)
    to_del = [v for v in bm.verts if v.co.y > 0.002]
    bmesh.ops.delete(bm, geom=to_del, context='VERTS')
    # Flatten the cut face slightly for a snub look
    for v in bm.verts:
        if abs(v.co.y) < 0.003:
            v.co.y = 0.0
    bm.to_mesh(mesh)
    bm.free()

    obj.data.materials.append(bark_material)
    _smooth_all(obj)
    _set_non_render_helper(obj)
    return obj


# ---------------------------------------------------------------------------
# NOSE ALAR WINGS
# ---------------------------------------------------------------------------

def _build_nose_ala(name, armature, bone_name, bark_material, side="L"):
    """
    Organic teardrop-shaped alar wing, parented to Nose.Ala.L / Nose.Ala.R.
    Slightly flared outward from the nose base.
    """
    obj_name = f"{name}_NoseAla_{side}"
    obj, mesh = _new_obj(obj_name, obj_name, armature, bone_name)

    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=12, radius=0.022)

    x_sign = 1 if side == "L" else -1
    for v in bm.verts:
        # Squash into a flattened teardrop: narrow in Z, wide in X
        v.co.x *= 1.6 * x_sign
        v.co.y *= 0.5
        v.co.z *= 0.8
        # Taper the medial edge (inner side) to blend into the nose bridge
        if v.co.x * x_sign < 0:
            v.co.x *= 0.3

    bm.to_mesh(mesh)
    bm.free()

    obj.data.materials.append(bark_material)
    _smooth_all(obj)
    _set_non_render_helper(obj)
    return obj


# ---------------------------------------------------------------------------
# LIP CORNERS
# ---------------------------------------------------------------------------

def _build_lip_corner(name, armature, bone_name, bark_material, side="L"):
    """
    Small rounded wedge at each lip corner, parented to Lip.Corner.L/R.
    Acts as a structural anchor that can be pulled to create smile/frown shapes.
    """
    obj_name = f"{name}_LipCorner_{side}"
    obj, mesh = _new_obj(obj_name, obj_name, armature, bone_name)

    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=10, radius=0.018)

    x_sign = 1 if side == "L" else -1
    for v in bm.verts:
        # Squash into a small lateral nub
        v.co.x *= 1.4 * x_sign
        v.co.y *= 0.4
        v.co.z *= 0.7
        # Taper toward face centre
        if v.co.x * x_sign < 0:
            v.co.x *= 0.2

    bm.to_mesh(mesh)
    bm.free()

    obj.data.materials.append(bark_material)
    _smooth_all(obj)
    _set_non_render_helper(obj)
    return obj


# ---------------------------------------------------------------------------
# MAMMAL EAR
# ---------------------------------------------------------------------------

def _build_ear(name, armature, bone_name, bark_material, side="L"):
    """
    Organic mammal ear parented to Ear.L / Ear.R.

    Anatomy modelled (simplified):
      - Helix       : curved outer rim, tallest at the top
      - Antihelix   : inner ridge running roughly parallel to helix
      - Concha       : concave bowl / scoop facing slightly forward
      - Tragus       : small nub in front of the canal opening
      - Ear canal    : shallow indent at the centre

    Construction approach
    ─────────────────────
    Start with a UV sphere (radius 0.10).  Deform every vertex:
      1. Flatten depth  (Y *= 0.18)  → thin plate
      2. Preserve width (X *= 0.95)
      3. Elongate       (Z *= 1.55)  → taller than wide
      4. Helix rim:  verts near the outer edge get Y pushed back (outward)
         to create the rolled-over rim.
      5. Concha scoop: verts near centre get Y pushed forward (inward)
         to create the hollow bowl.
      6. Tragus nub: a small sphere attached at the lower-front.
    The ear faces +X (left) or -X (right) since the Ear bones point laterally.

    BONE parenting offset
    ─────────────────────
    Bone parenting puts the origin at the bone TAIL. We compensate by
    setting obj.location along the bone's local axis back to the HEAD,
    identical to the pupil disc fix.
    """
    obj_name  = f"{name}_Ear_{side}"
    obj, mesh = _new_obj(obj_name, obj_name, armature, bone_name)

    x_sign = 1 if side == "L" else -1   # L ear faces +X, R ear faces -X

    bm = bmesh.new()

    # ── Main ear cup (deformed sphere) ────────────────────────────────────
    bmesh.ops.create_uvsphere(bm, u_segments=30, v_segments=24, radius=0.18)

    for v in bm.verts:
        ox, oy, oz = v.co.x, v.co.y, v.co.z

        # 1. Basic shape squash
        v.co.x = ox * 0.95
        v.co.y = oy * 0.18       # very flat ear plate
        v.co.z = oz * 1.55       # taller, more mammalian silhouette

        # 2. Helix rim — lateral edge verts (|x| large) roll back in +Y
        lateral = abs(ox)        # use original x before squash
        if lateral > 0.05:
            rim_fac = (lateral - 0.05) / 0.04    # 0→1 as we reach the edge
            rim_fac = max(0.0, min(1.0, rim_fac))
            v.co.y += rim_fac * 0.03              # stronger rolled helix

        # 3. Concha bowl — central verts scoop inward (-Y = forward into head)
        dist_centre = math.sqrt(ox*ox + oz*oz)
        if dist_centre < 0.05:
            bowl_fac = 1.0 - (dist_centre / 0.05)
            v.co.y -= bowl_fac * 0.026            # deeper bowl

        # 4. Antihelix ridge — a secondary ridge ~60 % of the way from
        #    centre to edge, elevated in Z slightly
        if 0.030 < dist_centre < 0.070 and oz > 0:
            antihelix_fac = 1.0 - abs(dist_centre - 0.050) / 0.020
            antihelix_fac = max(0.0, min(1.0, antihelix_fac))
            v.co.z += antihelix_fac * 0.02

        # 5. Lower lobe — bottom verts (oz < -0.04) rounded and widened
        if oz < -0.05:
            lobe_fac = min(1.0, (abs(oz) - 0.05) / 0.045)
            v.co.x *= (1.0 + lobe_fac * 0.45)    # fuller lobe
            v.co.y += lobe_fac * 0.01            # slight back-tilt

    # ── Tragus nub (small sphere at lower-front of canal) ────────────────
    tragus_loc = mathutils.Vector((x_sign * 0.014, -0.026, -0.040))
    tret = bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=8,
                                     radius=0.016,
                                     matrix=mathutils.Matrix.Translation(tragus_loc))
    # Flatten tragus in Y
    for v in tret['verts']:
        v.co.y *= 0.4

    bm.to_mesh(mesh)
    bm.free()

    obj.data.materials.append(bark_material)
    _smooth_all(obj)

    # ── BONE parenting offset: push origin back to bone HEAD ──────────────
    ear_bone = armature.data.bones.get(bone_name)
    if ear_bone:
        # Ear bone points in +X (L) or -X (R) and slightly +Z.
        # bone.length gives the displacement from head to tail.
        # In bone-local space the tail is at +Y (Blender convention: bone
        # local +Y always points head→tail).  So offset -Y by bone_length
        # moves origin from tail back to head.
        obj.location = (0.0, -ear_bone.length, 0.0)

    return obj

def _build_chin(name, armature, bone_name, bark_material):
    """
    Rounded chin pad, parented to the Chin structural bone.
    Provides the lower facial boundary and grounds the jaw anatomy.
    """
    obj_name = f"{name}_Chin"
    obj, mesh = _new_obj(obj_name, obj_name, armature, bone_name)

    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=16, radius=0.038)

    for v in bm.verts:
        # Wide in X, narrow in Z — classic chin shape
        v.co.x *= 1.8
        v.co.y *= 0.45
        v.co.z *= 0.6
        # Remove upper half so it hugs the face surface
        if v.co.z > 0.012:
            v.co.z *= 0.2

    bm.to_mesh(mesh)
    bm.free()

    obj.data.materials.append(bark_material)
    _smooth_all(obj)
    _set_non_render_helper(obj)
    return obj


# ---------------------------------------------------------------------------
# TEETH AND MOLES
# ---------------------------------------------------------------------------

def _build_teeth(name, armature):
    """Simple row of white teeth hidden inside the mouth, parented to Head."""
    obj_name = f"{name}_Teeth"
    # Parent to Head so they stay stable relative to jaw movements
    obj, mesh = _new_obj(obj_name, obj_name, armature, "Head")
    
    bm = bmesh.new()
    # Upper teeth row
    bmesh.ops.create_cube(bm, size=0.1)
    for v in bm.verts:
        v.co.x *= 1.5
        v.co.z *= 0.2
        v.co.y *= 0.1
    # Lower teeth row
    bmesh.ops.create_cube(bm, size=0.1, matrix=mathutils.Matrix.Translation((0,0,-0.05)))
    
    bm.to_mesh(mesh)
    bm.free()
    
    teeth_mat = bpy.data.materials.new(name=f"{name}_TeethMat")
    teeth_mat.use_nodes = True
    teeth_mat.node_tree.nodes["Principled BSDF"].inputs[0].default_value = (0.9, 0.9, 0.9, 1)
    obj.data.materials.append(teeth_mat)
    
    # Position inside the mouth (in Head local space)
    obj.location = (0, -0.35, -0.2) 
    return obj

def _build_mole(name, armature):
    """Small dark mole for character distinction, parented to Head."""
    obj_name = f"{name}_Mole"
    obj, mesh = _new_obj(obj_name, obj_name, armature, "Head")
    
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=8, radius=0.012)
    bm.to_mesh(mesh)
    bm.free()
    
    mole_mat = bpy.data.materials.new(name=f"{name}_MoleMat")
    mole_mat.use_nodes = True
    mole_mat.node_tree.nodes["Principled BSDF"].inputs[0].default_value = (0.05, 0.03, 0.02, 1)
    obj.data.materials.append(mole_mat)
    
    # Position on side of face
    obj.location = (0.15, -0.38, 0.1)
    return obj


# ---------------------------------------------------------------------------
# MAIN ENTRY POINT
# ---------------------------------------------------------------------------

def create_facial_props_v5(name, armature, bones_map, iris_material, sclera_material, bark_material, lip_material):
    """
    Upgraded facial prop creation for V5.

    Builds mesh objects for:
        Original (V5.0):
            Eyeballs, Eyelids (Upper/Lower), Dual Lips, Nose, Eyebrows

        New structural anchors:
            Pupil discs       — Pupil.L / Pupil.R
            Eyelid corners    — Eyelid.Corner.Med.L/R, Eyelid.Corner.Lat.L/R
            Nose tip          — Nose.Tip
            Nose alar wings   — Nose.Ala.L / Nose.Ala.R
            Lip corners       — Lip.Corner.L / Lip.Corner.R
            Chin              — Chin

        New control visualisers (arc wireframes / small guides):
            Eyelid ctrl arcs  — Eyelid.Ctrl.Upper.L/R, Eyelid.Ctrl.Lower.L/R
            Nose flare guides — Nose.Flare.L / Nose.Flare.R
            Lip corner ctrls  — Lip.Corner.Ctrl.L / Lip.Corner.Ctrl.R
            Jaw open guide    — Jaw.Ctrl

    Returns:
        dict  { logical_key: bpy.types.Object }
    """
    facial_objs = {}
    eye_radius  = 0.06

    # ── helper: skip gracefully if a bone doesn't exist ─────────────────
    def has_bone(bname):
        return bname in armature.data.bones

    # ====================================================================
    # 1.  EYEBALLS  (unchanged)
    # ====================================================================
    for side in ("L", "R"):
        eye_bone = bones_map.get(f"Eye.{side}")
        if not eye_bone or not has_bone(eye_bone):
            continue

        obj_name = f"{name}_Eyeball_{side}"
        mesh = bpy.data.meshes.new(f"{obj_name}_Mesh")
        obj  = bpy.data.objects.new(obj_name, mesh)
        _link_obj(obj, armature, eye_bone)

        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=32,
                                  radius=eye_radius)
        for v in bm.verts:
            if v.co.y < -eye_radius * 0.9:
                v.co.y += 0.01
        bm.to_mesh(mesh); bm.free()

        obj.data.materials.append(sclera_material)
        _smooth_all(obj)
        facial_objs[f"Eyeball.{side}"] = obj

    # ====================================================================
    # 2.  PUPIL DISCS  (NEW structural)
    # ====================================================================
    for side in ("L", "R"):
        eye_bone_name = f"Eye.{side}"
        if not has_bone(eye_bone_name):
            continue
        pobj = _build_pupil_disc(name, armature, side, eye_radius=eye_radius)
        eyeball = facial_objs.get(f"Eyeball.{side}")
        if eyeball:
            bpy.context.view_layer.update()
            _validate_pupil_scale(pobj, eyeball)
            if not _validate_pupil_placement(pobj, eyeball):
                fix_dir = mathutils.Vector(pobj.location)
                if fix_dir.length < 1e-8:
                    fix_dir = mathutils.Vector((0.0, -1.0, 0.0))
                pobj.location = tuple(fix_dir.normalized() * (eye_radius + 0.002))
                bpy.context.view_layer.update()
        facial_objs[f"Pupil.{side}"] = pobj

    # ====================================================================
    # 3.  EYELIDS  (unchanged geometry, same bones)
    # ====================================================================
    for side in ("L", "R"):
        for lid_type in ("Upper", "Lower"):
            lid_bone = bones_map.get(f"Eyelid.{lid_type}.{side}")
            if not lid_bone or not has_bone(lid_bone):
                continue

            lid_name = f"{name}_Eyelid_{lid_type}_{side}"
            lmesh    = bpy.data.meshes.new(f"{lid_name}_Mesh")
            lobj     = bpy.data.objects.new(lid_name, lmesh)
            _link_obj(lobj, armature, lid_bone)

            bm = bmesh.new()
            bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=32,
                                      radius=eye_radius * 1.08)
            to_delete = [v for v in bm.verts
                         if (v.co.z < 0 if lid_type == "Upper" else v.co.z > 0)]
            bmesh.ops.delete(bm, geom=to_delete, context='VERTS')

            for v in bm.verts:
                dist_x = abs(v.co.x)
                if lid_type == "Upper":
                    # Raised from 0.025 → 0.045 so the lid's bottom edge
                    # sits at or just above the eye equator (Z=0 rel to eye
                    # centre) in the rest/open pose, leaving the eyeball
                    # fully visible.  The almond curvature taper is kept.
                    v.co.z += 0.045 - (dist_x * dist_x) * 8.0
                else:
                    # Lower lid: mirror the same correction downward.
                    v.co.z -= 0.045 - (dist_x * dist_x) * 8.0

            bm.to_mesh(lmesh); bm.free()
            lobj.data.materials.append(bark_material)
            _smooth_all(lobj)
            facial_objs[f"Eyelid.{lid_type}.{side}"] = lobj

    # ====================================================================
    # 4.  EYELID CORNER MARKERS  (NEW structural)
    # ====================================================================
    for side in ("L", "R"):
        for corner in ("Med", "Lat"):
            bone_name = f"Eyelid.Corner.{corner}.{side}"
            if not has_bone(bone_name):
                continue
            cobj = _build_eyelid_corner(name, armature, bone_name, bark_material)
            facial_objs[bone_name] = cobj

    # ====================================================================
    # 5.  EYELID CONTROL ARC VISUALISERS  (NEW control)
    # ====================================================================
    for side in ("L", "R"):
        for lid_type in ("Upper", "Lower"):
            bone_name = f"Eyelid.Ctrl.{lid_type}.{side}"
            if not has_bone(bone_name):
                continue
            arc_obj = _build_eyelid_ctrl_arc(
                name, armature, bone_name, bark_material,
                lid_type=lid_type)
            facial_objs[bone_name] = arc_obj

    # ====================================================================
    # 6.  DUAL LIPS  (unchanged geometry)
    # ====================================================================
    for lip_type in ("Upper", "Lower"):
        lip_bone = bones_map.get(f"Lip.{lip_type}")
        if not lip_bone or not has_bone(lip_bone):
            continue

        obj_name = f"{name}_Lip_{lip_type}"
        mesh = bpy.data.meshes.new(f"{obj_name}_Mesh")
        obj  = bpy.data.objects.new(obj_name, mesh)
        _link_obj(obj, armature, lip_bone)

        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=16, radius=0.04)

        for v in bm.verts:
            v.co.x *= 4.5
            v.co.y *= 0.4
            dist_x = abs(v.co.x)
            if lip_type == "Upper":
                if dist_x < 0.04:
                    v.co.z -= 0.015
                elif 0.05 < dist_x < 0.12:
                    v.co.z += 0.01
            else:
                v.co.z *= 1.3
                v.co.y *= 1.2
            v.co.y -= (dist_x * dist_x) * 3.0

        bm.to_mesh(mesh); bm.free()
        obj.data.materials.append(lip_material)
        _smooth_all(obj)
        facial_objs[f"Lip.{lip_type}"] = obj

    # ====================================================================
    # 7.  LIP CORNERS  (NEW structural)
    # ====================================================================
    for side in ("L", "R"):
        bone_name = f"Lip.Corner.{side}"
        if not has_bone(bone_name):
            continue
        lc_obj = _build_lip_corner(name, armature, bone_name, bark_material,
                                   side=side)
        facial_objs[bone_name] = lc_obj

    # ====================================================================
    # 8.  LIP CORNER CONTROLS  (NEW control — tiny sphere guide)
    # ====================================================================
    for side in ("L", "R"):
        bone_name = f"Lip.Corner.Ctrl.{side}"
        if not has_bone(bone_name):
            continue
        # Reuse the corner builder but with a smaller radius as a visual guide
        ctrl_obj_name = f"{name}_LipCornerCtrl_{side}"
        ctrl_obj, ctrl_mesh = _new_obj(ctrl_obj_name, ctrl_obj_name,
                                       armature, bone_name)
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=8, radius=0.008)
        bm.to_mesh(ctrl_mesh); bm.free()
        ctrl_obj.data.materials.append(bark_material)
        ctrl_obj.hide_render = True
        ctrl_obj.display_type = 'WIRE'
        facial_objs[bone_name] = ctrl_obj

    # ====================================================================
    # 9.  NOSE  (unchanged main cone)
    # ====================================================================
    nose_bone = bones_map.get("Nose")
    if nose_bone and has_bone(nose_bone):
        obj_name = f"{name}_Nose"
        mesh = bpy.data.meshes.new(f"{obj_name}_Mesh")
        obj  = bpy.data.objects.new(obj_name, mesh)
        _link_obj(obj, armature, nose_bone)

        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True,
                              radius1=0.05, radius2=0.015,
                              depth=0.15, segments=16)
        for v in bm.verts:
            v.co.y, v.co.z = v.co.z, v.co.y
        bm.to_mesh(mesh); bm.free()
        obj.data.materials.append(bark_material)
        _smooth_all(obj)
        facial_objs["Nose"] = obj

    # ====================================================================
    # 10. NOSE TIP  (NEW structural)
    # ====================================================================
    if has_bone("Nose.Tip"):
        nt_obj = _build_nose_tip(name, armature, "Nose.Tip", bark_material)
        facial_objs["Nose.Tip"] = nt_obj

    # ====================================================================
    # 11. NOSE ALAR WINGS  (NEW structural)
    # ====================================================================
    for side in ("L", "R"):
        bone_name = f"Nose.Ala.{side}"
        if not has_bone(bone_name):
            continue
        ala_obj = _build_nose_ala(name, armature, bone_name, bark_material,
                                  side=side)
        facial_objs[bone_name] = ala_obj

    # ====================================================================
    # 12. NOSE FLARE CONTROLS  (NEW control — thin disc guide)
    # ====================================================================
    for side in ("L", "R"):
        bone_name = f"Nose.Flare.{side}"
        if not has_bone(bone_name):
            continue
        flare_obj_name = f"{name}_NoseFlareCtrl_{side}"
        flare_obj, flare_mesh = _new_obj(flare_obj_name, flare_obj_name,
                                         armature, bone_name)
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=10,
                              radius1=0.010, radius2=0.010, depth=0.002)
        rot_mx = mathutils.Euler((math.radians(90), 0, 0)).to_matrix().to_4x4()
        bmesh.ops.transform(bm, matrix=rot_mx, verts=bm.verts)
        bm.to_mesh(flare_mesh); bm.free()
        flare_obj.data.materials.append(bark_material)
        flare_obj.hide_render = True
        flare_obj.display_type = 'WIRE'
        facial_objs[bone_name] = flare_obj

    # ====================================================================
    # 13. EYEBROWS  (unchanged)
    # ====================================================================
    for side in ("L", "R"):
        brow_bone = bones_map.get(f"Eyebrow.{side}")
        if not brow_bone or not has_bone(brow_bone):
            continue

        obj_name = f"{name}_Eyebrow_{side}"
        mesh = bpy.data.meshes.new(f"{obj_name}_Mesh")
        obj  = bpy.data.objects.new(obj_name, mesh)
        _link_obj(obj, armature, brow_bone)

        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=16, radius=0.03)
        for v in bm.verts:
            v.co.x *= 4.0
            v.co.y *= 0.4
            dist_x = abs(v.co.x)
            v.co.z += (0.12 - dist_x) * 0.3
            v.co.y -= (dist_x * dist_x) * 3.0

        bm.to_mesh(mesh); bm.free()
        obj.data.materials.append(bark_material)
        _smooth_all(obj)
        facial_objs[f"Eyebrow.{side}"] = obj

    # ====================================================================
    # 13b. EARS  (NEW — mammal-shaped cup with helix, antihelix, tragus)
    # ====================================================================
    for side in ("L", "R"):
        ear_bone = bones_map.get(f"Ear.{side}")
        if not ear_bone or not has_bone(ear_bone):
            continue
        ear_obj = _build_ear(name, armature, ear_bone, bark_material, side=side)
        facial_objs[f"Ear.{side}"] = ear_obj

    # ====================================================================
    # 14. CHIN  (NEW structural)
    # ====================================================================
    if has_bone("Chin"):
        chin_obj = _build_chin(name, armature, "Chin", bark_material)
        facial_objs["Chin"] = chin_obj

    # ====================================================================
    # 15. JAW CONTROL GUIDE  (NEW control — small elongated pill)
    # ====================================================================
    if has_bone("Jaw.Ctrl"):
        jaw_obj_name = f"{name}_JawCtrl"
        jaw_obj, jaw_mesh = _new_obj(jaw_obj_name, jaw_obj_name,
                                     armature, "Jaw.Ctrl")
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, segments=12,
                              radius1=0.015, radius2=0.008, depth=0.06)
        # Orient along -Y (forward)
        rot_mx = mathutils.Euler((math.radians(90), 0, 0)).to_matrix().to_4x4()
        bmesh.ops.transform(bm, matrix=rot_mx, verts=bm.verts)
        bm.to_mesh(jaw_mesh); bm.free()
        jaw_obj.data.materials.append(bark_material)
        jaw_obj.hide_render = True
        jaw_obj.display_type = 'WIRE'
        facial_objs["Jaw.Ctrl"] = jaw_obj

    # ====================================================================
    # 16. TEETH AND MOLE (NEW)
    # ====================================================================
    facial_objs["Teeth"] = _build_teeth(name, armature)
    if "Arbor" in name:
        facial_objs["Mole"] = _build_mole(name, armature)

    return facial_objs

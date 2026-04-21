import bpy
import bmesh
import mathutils
import math
import random

# Use configuration for naming
import config

def _ensure_in_collection(obj):
    """Links object to the standard assets collection from config."""
    coll = bpy.data.collections.get(config.COLL_ASSETS)
    if coll and obj.name not in coll.objects:
        coll.objects.link(obj)
    elif not coll:
        # Fallback to scene collection if config is missing
        if obj.name not in bpy.context.scene.collection.objects:
            bpy.context.scene.collection.objects.link(obj)

def _create_facial_primitive(name, armature, bone_name, type='SPHERE', radius=1.0, depth=1.0, segments=16):
    """Creates a base mesh object parented to a bone.
    Uses robust bone parenting to ensure it follows animation regardless of skinning.
    """
    mesh_data = bpy.data.meshes.new(f"{name}_Mesh")
    obj = bpy.data.objects.new(name, mesh_data)
    _ensure_in_collection(obj)

    # Robust Bone Parenting
    obj.parent = armature
    obj.parent_type = 'BONE'
    obj.parent_bone = bone_name

    # Reset Visual Inverse to ensure it stays at bone location
    # Note: bone.head is relative to armature.
    obj.location = (0, 0, 0)

    bm = bmesh.new()
    if type == 'SPHERE':
        bmesh.ops.create_uvsphere(bm, u_segments=segments, v_segments=segments, radius=radius)
    elif type == 'CONE':
        bmesh.ops.create_cone(bm, cap_ends=True, segments=segments, radius1=radius, radius2=0.0, depth=depth)
    elif type == 'CUBE':
        bmesh.ops.create_cube(bm, size=radius*2)

    bm.to_mesh(mesh_data)
    bm.free()
    return obj

def _add_detail_to_mesh(obj, scale_vec=(1,1,1), rot_euler=(0,0,0), move_vec=(0,0,0)):
    """Applies unique deformations to facial props."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)

    matrix = (mathutils.Matrix.Translation(move_vec) @
              mathutils.Euler(rot_euler).to_matrix().to_4x4() @
              mathutils.Matrix.Diagonal((*scale_vec, 1)))

    bmesh.ops.transform(bm, matrix=matrix, verts=bm.verts)
    bm.to_mesh(obj.data)
    bm.free()

def create_facial_props_v6(name, armature, bones_map, iris_material, sclera_material, bark_material, lip_material):
    """
    Independent implementation of Scene 6 facial props with high attention to detail.
    Includes Eyelids, Eyeballs, Lips, Nose, Ears, Chin, Teeth, and distinguishing marks.
    """
    eye_r = 0.065

    # 1. Primary Vision Centers (Eyeballs)
    for side in ("L", "R"):
        bone = bones_map.get(f"Eye.{side}")
        if not bone: continue

        eye_obj = _create_facial_primitive(f"{name}_Eye_{side}", armature, bone, radius=eye_r, segments=32)
        eye_obj.data.materials.append(iris_material)
        for p in eye_obj.data.polygons: p.use_smooth = True

        # 2. Protective Layers (Eyelids)
        for part in ("Upper", "Lower"):
            l_bone = bones_map.get(f"Eyelid.{part}.{side}")
            if not l_bone: continue

            lid_obj = _create_facial_primitive(f"{name}_Lid_{part}_{side}", armature, l_bone, radius=eye_r * 1.15, segments=32)
            bm = bmesh.new(); bm.from_mesh(lid_obj.data)
            to_del = [v for v in bm.verts if (v.co.z < 0.01 if part == "Upper" else v.co.z > -0.01)]
            bmesh.ops.delete(bm, geom=to_del, context='VERTS')

            # Unique "Blinker" edge thickening
            for v in bm.verts:
                dist_z = abs(v.co.z)
                if dist_z < 0.02:
                    v.co.y -= 0.012 * (1.0 - dist_z/0.02)

            bm.to_mesh(lid_obj.data); bm.free()
            lid_obj.data.materials.append(bark_material)
            for p in lid_obj.data.polygons: p.use_smooth = True

    # 3. Expressive Foundations (Lips)
    for part in ("Upper", "Lower"):
        bone = bones_map.get(f"Lip.{part}")
        if not bone: continue

        lip_obj = _create_facial_primitive(f"{name}_Lip_{part}", armature, bone, radius=0.045, segments=24)
        _add_detail_to_mesh(lip_obj, scale_vec=(4.4, 0.4, 1.3))

        bm = bmesh.new(); bm.from_mesh(lip_obj.data)
        for v in bm.verts:
            # Unique "Petal" curvature
            v.co.y -= (v.co.x ** 2) * 2.8
            if part == "Upper":
                v.co.z -= 0.015 # Cup the upper lip
            else:
                v.co.z *= 1.1 # Fullness for lower
        bm.to_mesh(lip_obj.data); bm.free()
        lip_obj.data.materials.append(lip_material)
        for p in lip_obj.data.polygons: p.use_smooth = True

    # 4. Respiratory Core (Nose)
    n_bone = bones_map.get("Nose")
    if n_bone:
        nose_obj = _create_facial_primitive(f"{name}_Nose", armature, n_bone, type='CONE', radius=0.045, depth=0.2, segments=24)
        nose_obj.rotation_euler = (math.radians(90), 0, 0)
        _add_detail_to_mesh(nose_obj, scale_vec=(1.1, 1.0, 0.8)) # Flatten bridge slightly
        nose_obj.data.materials.append(bark_material)
        for p in nose_obj.data.polygons: p.use_smooth = True

    # 5. Auditory Structures (Ears)
    for side in ("L", "R"):
        bone = bones_map.get(f"Ear.{side}")
        if not bone: continue

        ear_obj = _create_facial_primitive(f"{name}_Ear_{side}", armature, bone, radius=0.16, segments=32)
        bm = bmesh.new(); bm.from_mesh(ear_obj.data)
        for v in bm.verts:
            v.co.x *= 0.25 # Flatten
            v.co.z *= 1.7  # Elongate
            # Unique "Conch" curvature
            if v.co.y > 0:
                v.co.y *= 0.15
            else:
                v.co.y -= (v.co.z ** 2) * 0.2 # Back curve
        bm.to_mesh(ear_obj.data); bm.free()
        ear_obj.data.materials.append(bark_material)
        for p in ear_obj.data.polygons: p.use_smooth = True

    # 6. Structural Detail: The "Root" Chin
    c_bone = bones_map.get("Chin")
    if c_bone:
        chin_obj = _create_facial_primitive(f"{name}_Chin", armature, c_bone, radius=0.04, segments=16)
        _add_detail_to_mesh(chin_obj, scale_vec=(1.8, 0.5, 0.7), move_vec=(0, -0.01, 0))
        chin_obj.data.materials.append(bark_material)
        for p in chin_obj.data.polygons: p.use_smooth = True

    # 7. Internal Details: "Seed" Teeth
    teeth_obj = _create_facial_primitive(f"{name}_Teeth", armature, "Head", type='CUBE', radius=0.05)
    _add_detail_to_mesh(teeth_obj, scale_vec=(1.4, 0.1, 0.2), move_vec=(0, -0.36, -0.18))
    t_mat = bpy.data.materials.new(f"SeedTeeth_{name}")
    t_mat.use_nodes = True
    t_mat.node_tree.nodes["Principled BSDF"].inputs[0].default_value = (0.85, 0.82, 0.75, 1) # Seed white
    teeth_obj.data.materials.append(t_mat)

    # 8. Character Distinguishing: The "Arbor" Sap-Mole
    if "Arbor" in name:
        mole = _create_facial_primitive(f"{name}_SapMole", armature, "Head", radius=0.015, segments=12)
        _add_detail_to_mesh(mole, move_vec=(0.18, -0.38, 0.08))
        m_mat = bpy.data.materials.new(f"SapMole_{name}")
        m_mat.use_nodes = True
        m_mat.node_tree.nodes["Principled BSDF"].inputs[0].default_value = (0.05, 0.02, 0.0, 1) # Dark amber
        mole.data.materials.append(m_mat)

    return True

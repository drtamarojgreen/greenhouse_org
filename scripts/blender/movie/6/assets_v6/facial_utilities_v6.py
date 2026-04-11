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
    """Creates a base mesh object parented to a bone."""
    mesh_data = bpy.data.meshes.new(f"{name}_Mesh")
    obj = bpy.data.objects.new(name, mesh_data)
    _ensure_in_collection(obj)

    obj.parent = armature
    obj.parent_type = 'BONE'
    obj.parent_bone = bone_name
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

def create_facial_props_v6(name, armature, bones_map, iris_material, sclera_material, bark_material, lip_material):
    """
    Independent implementation of Scene 6 facial props.
    Ensures unique geometry and correct visibility (especially eyelids).
    """
    eye_r = 0.065

    # 1. Primary Vision Centers (Eyeballs)
    for side in ("L", "R"):
        bone = bones_map.get(f"Eye.{side}")
        if not bone: continue

        eye_obj = _create_facial_primitive(f"{name}_Eye_{side}", armature, bone, radius=eye_r, segments=32)
        eye_obj.data.materials.append(iris_material) # Use the advanced iris shader

        # Smooth polygons
        for p in eye_obj.data.polygons: p.use_smooth = True

        # 2. Protective Layers (Eyelids) - Unique Math Approach
        for part in ("Upper", "Lower"):
            l_bone = bones_map.get(f"Eyelid.{part}.{side}")
            if not l_bone: continue

            # Create hemi-spheres with a slight protrusion for better camera visibility
            lid_obj = _create_facial_primitive(f"{name}_Lid_{part}_{side}", armature, l_bone, radius=eye_r * 1.12, segments=32)
            bm = bmesh.from_edit_mesh(lid_obj.data) if lid_obj.mode == 'EDIT' else bmesh.new()
            if lid_obj.mode != 'EDIT': bm.from_mesh(lid_obj.data)

            # Remove half the sphere based on part
            to_del = [v for v in bm.verts if (v.co.z < 0 if part == "Upper" else v.co.z > 0)]
            bmesh.ops.delete(bm, geom=to_del, context='VERTS')

            # Add a unique "rim" thickness
            for v in bm.verts:
                if abs(v.co.z) < 0.01:
                    v.co.y -= 0.01 # Protrude the edge

            bm.to_mesh(lid_obj.data)
            bm.free()
            lid_obj.data.materials.append(bark_material)
            for p in lid_obj.data.polygons: p.use_smooth = True

    # 3. Expressive Foundations (Lips)
    for part in ("Upper", "Lower"):
        bone = bones_map.get(f"Lip.{part}")
        if not bone: continue

        lip_obj = _create_facial_primitive(f"{name}_Lip_{part}", armature, bone, radius=0.045, segments=24)
        # Deform into unique leaf-like lip shapes
        bm = bmesh.new(); bm.from_mesh(lip_obj.data)
        for v in bm.verts:
            v.co.x *= 4.2
            v.co.y *= 0.35
            v.co.z *= 1.2
            # Curvature
            v.co.y -= (v.co.x ** 2) * 2.5
            if part == "Upper": v.co.z -= 0.01
        bm.to_mesh(lip_obj.data); bm.free()
        lip_obj.data.materials.append(lip_material)
        for p in lip_obj.data.polygons: p.use_smooth = True

    # 4. Respiratory Core (Nose)
    n_bone = bones_map.get("Nose")
    if n_bone:
        nose_obj = _create_facial_primitive(f"{name}_Nose", armature, n_bone, type='CONE', radius=0.04, depth=0.18, segments=20)
        # Orient forward
        nose_obj.rotation_euler = (math.radians(90), 0, 0)
        nose_obj.data.materials.append(bark_material)
        for p in nose_obj.data.polygons: p.use_smooth = True

    # 5. Auditory Structures (Ears)
    for side in ("L", "R"):
        bone = bones_map.get(f"Ear.{side}")
        if not bone: continue

        ear_obj = _create_facial_primitive(f"{name}_Ear_{side}", armature, bone, radius=0.15, segments=24)
        bm = bmesh.new(); bm.from_mesh(ear_obj.data)
        for v in bm.verts:
            v.co.x *= 0.2
            v.co.z *= 1.8
            # Cup shape
            if v.co.y > 0: v.co.y *= 0.1
        bm.to_mesh(ear_obj.data); bm.free()
        ear_obj.data.materials.append(bark_material)
        for p in ear_obj.data.polygons: p.use_smooth = True

    return True

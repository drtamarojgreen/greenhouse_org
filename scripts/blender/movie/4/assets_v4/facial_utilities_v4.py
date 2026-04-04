import bpy
import bmesh
import mathutils
import math

def create_facial_props_v4(name, armature, bones_map, iris_material, bark_material):
    """
    Upgraded facial prop creation for V4:
    - Eyeballs + Eyelids
    - Dual lips (Upper/Lower)
    """
    facial_objs = {}
    eye_radius = 0.06

    # 1. Eyeballs & Eyelids
    for side in ["L", "R"]:
        eye_bone = bones_map.get(f"Eye.{side}")
        if not eye_bone: continue
            
        # Eyeball
        obj_name = f"{name}_Eyeball_{side}"
        mesh = bpy.data.meshes.new(f"{obj_name}_Mesh")
        obj = bpy.data.objects.new(obj_name, mesh)
        bpy.context.scene.collection.objects.link(obj)
        obj.parent = armature; obj.parent_type = 'BONE'; obj.parent_bone = eye_bone
        obj.location = (0, 0, 0) # Align to bone head (surface)
        
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=32, radius=eye_radius)
        # Small iris indentation
        for v in bm.verts:
            if v.co.y < -eye_radius * 0.9: v.co.y += 0.01
        bm.to_mesh(mesh); bm.free()
        obj.data.materials.append(iris_material)
        for p in obj.data.polygons: p.use_smooth = True
        facial_objs[f"Eyeball.{side}"] = obj

        # Eyelids
        for lid_type in ["Upper", "Lower"]:
            lid_bone = bones_map.get(f"Eyelid.{lid_type}.{side}")
            if not lid_bone: continue
            
            lid_name = f"{name}_Eyelid_{lid_type}_{side}"
            lmesh = bpy.data.meshes.new(f"{lid_name}_Mesh")
            lobj = bpy.data.objects.new(lid_name, lmesh)
            bpy.context.scene.collection.objects.link(lobj)
            lobj.parent = armature; lobj.parent_type = 'BONE'; lobj.parent_bone = lid_bone
            lobj.location = (0, 0, 0)
            
            bm = bmesh.new()
            bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=32, radius=eye_radius * 1.08)
            
            # Now +Z is top of eye, -Z is bottom.
            to_delete = [v for v in bm.verts if (v.co.z < 0 if lid_type == "Upper" else v.co.z > 0)]
            bmesh.ops.delete(bm, geom=to_delete, context='VERTS')
            
            # Sculpt Almond curvature: Lift center drastically to reveal eye, swoop sides down to wrap sphere
            for v in bm.verts:
                dist_x = abs(v.co.x)
                if lid_type == "Upper":
                    v.co.z += 0.025 - ((dist_x * dist_x) * 8.0)
                else:
                    v.co.z -= 0.025 - ((dist_x * dist_x) * 8.0)
                    
            bm.to_mesh(lmesh); bm.free()
            lobj.data.materials.append(bark_material)
            for p in lobj.data.polygons: p.use_smooth = True
            facial_objs[f"Eyelid.{lid_type}.{side}"] = lobj

    # 2. Dual Lips (Refined Organic M-shape using Spheres)
    for lip_type in ["Upper", "Lower"]:
        lip_bone = bones_map.get(f"Lip.{lip_type}")
        if not lip_bone: continue
            
        obj_name = f"{name}_Lip_{lip_type}"
        mesh = bpy.data.meshes.new(f"{obj_name}_Mesh")
        obj = bpy.data.objects.new(obj_name, mesh)
        bpy.context.scene.collection.objects.link(obj)
        obj.parent = armature; obj.parent_type = 'BONE'; obj.parent_bone = lip_bone
        obj.location = (0, 0, 0) # Removed floating offset completely
        
        bm = bmesh.new()
        # UV Sphere guarantees perfectly tapered, rounded ends, removing the "rectangle" look
        bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=16, radius=0.04)
        
        for v in bm.verts:
            # 1. Widen across face (X)
            v.co.x *= 4.5
            
            # 2. Flatten depth (Y)
            v.co.y *= 0.4
            
            # 3. Sculpt shape (Z height)
            dist_x = abs(v.co.x)
            
            if lip_type == "Upper":
                # Sculpt 'M' (Cupid's Bow)
                if dist_x < 0.04:
                    v.co.z -= 0.015 # Center dip
                elif 0.05 < dist_x < 0.12:
                    v.co.z += 0.01 # Rise to peaks
            else:
                # Lower lip is fuller
                v.co.z *= 1.3
                v.co.y *= 1.2
            
            # Curve lip around face (-Y moves backwards globally, wrapping snugly into the cheeks)
            v.co.y -= (dist_x * dist_x) * 3.0
            
        bm.to_mesh(mesh); bm.free()
        obj.data.materials.append(bark_material)
        for p in obj.data.polygons: p.use_smooth = True
        facial_objs[f"Lip.{lip_type}"] = obj

    # 3. Botanical Nose
    nose_bone = bones_map.get("Nose")
    if nose_bone:
        obj_name = f"{name}_Nose"
        mesh = bpy.data.meshes.new(f"{obj_name}_Mesh")
        obj = bpy.data.objects.new(obj_name, mesh)
        bpy.context.scene.collection.objects.link(obj)
        obj.parent = armature; obj.parent_type = 'BONE'; obj.parent_bone = nose_bone
        obj.location = (0, 0, 0)
        
        bm = bmesh.new()
        bmesh.ops.create_cone(bm, cap_ends=True, radius1=0.05, radius2=0.015, depth=0.15, segments=16)
        for v in bm.verts:
            v.co.y, v.co.z = v.co.z, v.co.y # Orient forward correctly (Point sticking outwards)
        bm.to_mesh(mesh); bm.free()
        obj.data.materials.append(bark_material)
        for p in obj.data.polygons: p.use_smooth = True
        facial_objs["Nose"] = obj

    # 4. Botanical Eyebrows (New)
    for side in ["L", "R"]:
        brow_bone = bones_map.get(f"Eyebrow.{side}")
        if not brow_bone: continue
        
        obj_name = f"{name}_Eyebrow_{side}"
        mesh = bpy.data.meshes.new(f"{obj_name}_Mesh")
        obj = bpy.data.objects.new(obj_name, mesh)
        bpy.context.scene.collection.objects.link(obj)
        obj.parent = armature; obj.parent_type = 'BONE'; obj.parent_bone = brow_bone
        obj.location = (0, 0, 0)
        
        bm = bmesh.new()
        # Arching leaf/botanical continuous line
        bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=16, radius=0.03)
        for v in bm.verts:
            # Widen (X)
            v.co.x *= 4.0
            # Flatten (Y)
            v.co.y *= 0.4
            
            # Curve the brow into an arch along Z
            dist_x = abs(v.co.x)
            v.co.z += (0.12 - dist_x) * 0.3
            
            # Curve the brow into the forehead (Local -Y is Global +Y, pointing into head)
            v.co.y -= (dist_x * dist_x) * 3.0
            
        bm.to_mesh(mesh); bm.free()
        obj.data.materials.append(bark_material)
        for p in obj.data.polygons: p.use_smooth = True
        facial_objs[f"Eyebrow.{side}"] = obj

    return facial_objs

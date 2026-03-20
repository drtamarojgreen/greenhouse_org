import bpy
import bmesh
import mathutils
import math

def create_facial_props(name, armature, bones_map, iris_material, bark_material, eye_radius=0.06):
    """
    Standardized facial prop creation for eyes, mouth, and brows.
    armature: The character armature object.
    bones_map: Dictionary mapping 'Eye.L', 'Eye.R', 'Mouth' to bone names.
    """
    facial_objs = {}
    
    # helper to create UVs for a sphere
    def apply_spherical_uvs(bm):
        uv_layer = bm.loops.layers.uv.verify()
        for face in bm.faces:
            for loop in face.loops:
                co = loop.vert.co.normalized()
                u = 0.5 + (math.atan2(co.y, co.x) / (2 * math.pi))
                v = 0.5 - (math.asin(co.z) / math.pi)
                loop[uv_layer].uv = (u, v)

    # 1. Eyes
    for side in ["L", "R"]:
        bname = bones_map.get(f"Eye.{side}")
        if not bname or bname not in armature.data.bones:
            continue
            
        obj_name = f"{name}_Eye_{side}"
        mesh = bpy.data.meshes.new(f"{obj_name}_MeshData")
        obj = bpy.data.objects.new(obj_name, mesh)
        bpy.context.scene.collection.objects.link(obj)
        
        obj.parent = armature
        obj.parent_type = 'BONE'
        obj.parent_bone = bname
        obj.location = (0, 0, 0)
        
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=16, radius=eye_radius)
        # Point 142: Ensure forward orientation (eyes look down -Y in Blender local usually)
        # Actually iris shader expects UV center. 
        apply_spherical_uvs(bm)
        bm.to_mesh(mesh)
        bm.free()
        
        obj.data.materials.append(iris_material)
        facial_objs[f"Eye.{side}"] = obj

    # 2. Mouth
    bname = bones_map.get("Mouth")
    if bname and bname in armature.data.bones:
        obj_name = f"{name}_Mouth"
        mesh = bpy.data.meshes.new(f"{obj_name}_MeshData")
        obj = bpy.data.objects.new(obj_name, mesh)
        bpy.context.scene.collection.objects.link(obj)
        
        obj.parent = armature
        obj.parent_type = 'BONE'
        obj.parent_bone = bname
        obj.location = (0, 0, 0)
        
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1.0)
        # Squash into a sliver
        for v in bm.verts:
            v.co.x *= 0.15 # Width
            v.co.y *= 0.01 # Depth
            v.co.z *= 0.02 # Height
        bm.to_mesh(mesh)
        bm.free()
        
        obj.data.materials.append(bark_material)
        facial_objs["Mouth"] = obj

    # 3. Brows (Optional)
    for side in ["L", "R"]:
        bname = bones_map.get(f"Brow.{side}")
        if not bname or bname not in armature.data.bones:
            continue
            
        obj_name = f"{name}_Brow_{side}"
        mesh = bpy.data.meshes.new(f"{obj_name}_MeshData")
        obj = bpy.data.objects.new(obj_name, mesh)
        bpy.context.scene.collection.objects.link(obj)
        
        obj.parent = armature
        obj.parent_type = 'BONE'
        obj.parent_bone = bname
        obj.location = (0, 0, 0)
        
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1.0)
        for v in bm.verts:
            v.co.x *= 0.08
            v.co.y *= 0.01
            v.co.z *= 0.01
        bm.to_mesh(mesh)
        bm.free()
        
        obj.data.materials.append(bark_material)
        facial_objs[f"Brow.{side}"] = obj

    return facial_objs

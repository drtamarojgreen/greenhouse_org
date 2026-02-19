import bpy
import math
import mathutils
import style

def create_hologram(location, size=1.0):
    """Point 95: BMesh Hologram creation."""
    import bmesh
    mesh_data = bpy.data.meshes.new("Holo_MeshData")
    obj = bpy.data.objects.new("Hologram", mesh_data)
    bpy.context.collection.objects.link(obj)
    obj.location = mathutils.Vector(location) + mathutils.Vector((0, 0, 1.2))
    obj.rotation_euler = (math.radians(90), 0, 0)

    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=size/2)
    bm.to_mesh(mesh_data)
    bm.free()

    mat = bpy.data.materials.new(name="HoloMat")
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0, 0.5, 1, 1)
    style.set_principled_socket(mat, "Emission", (0, 0.8, 1, 1))
    style.set_principled_socket(mat, "Emission Strength", 5.0)
    bsdf.inputs["Alpha"].default_value = 0.3

    # Point 76: Modern transparency for Blender 4.2+
    style.set_blend_method(mat, 'BLEND')

    holo.data.materials.append(mat)

    return holo

def create_lab_bench(location):
    """Point 95: BMesh Lab Bench creation."""
    import bmesh
    mesh_data = bpy.data.meshes.new("Bench_MeshData")
    obj = bpy.data.objects.new("LabBench", mesh_data)
    bpy.context.collection.objects.link(obj)
    obj.location = mathutils.Vector(location) + mathutils.Vector((0,0,0.4))

    bm = bmesh.new()
    ret = bmesh.ops.create_cube(bm, size=1.0)
    for v in ret['verts']:
        v.co.x *= 2.0
        v.co.y *= 1.0
        v.co.z *= 0.4
    bm.to_mesh(mesh_data)
    bm.free()

    mat = bpy.data.materials.new(name="BenchMat")
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.1, 0.1, 0.1, 1)
    mat.node_tree.nodes["Principled BSDF"].inputs["Metallic"].default_value = 1.0
    mat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.1
    obj.data.materials.append(mat)

    return obj

if __name__ == "__main__":
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    create_lab_bench(mathutils.Vector((0,0,0)))
    create_hologram(mathutils.Vector((0,0,0)))

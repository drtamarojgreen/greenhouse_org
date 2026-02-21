import bpy
import math
import mathutils
import style_utilities as style

def create_hologram(location, size=1.0):
    import bmesh; mesh = bpy.data.meshes.new("Holo_MeshData"); obj = bpy.data.objects.new("Hologram", mesh); bpy.context.scene.collection.objects.link(obj); obj.location = mathutils.Vector(location) + mathutils.Vector((0, 0, 1.2)); obj.rotation_euler = (1.57, 0, 0)
    bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=size/2); bm.to_mesh(mesh); bm.free()
    mat = bpy.data.materials.new(name="HoloMat"); bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0, 0.5, 1, 1); style.set_principled_socket(mat, "Emission Color", (0, 0.8, 1, 1)); style.set_principled_socket(mat, "Emission Strength", 5.0)
    bsdf.inputs["Alpha"].default_value = 0.3; style.set_blend_method(mat, 'BLENDED'); obj.data.materials.append(mat)
    return obj

def create_lab_bench(location):
    import bmesh; mesh = bpy.data.meshes.new("Bench_MeshData"); obj = bpy.data.objects.new("LabBench", mesh); bpy.context.scene.collection.objects.link(obj); obj.location = mathutils.Vector(location) + mathutils.Vector((0,0,0.4))
    bm = bmesh.new(); ret = bmesh.ops.create_cube(bm, size=1.0)
    for v in ret['verts']: v.co.x *= 2.0; v.co.y *= 1.0; v.co.z *= 0.4
    bm.to_mesh(mesh); bm.free(); mat = bpy.data.materials.new(name="BenchMat"); bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value, bsdf.inputs["Metallic"].default_value, bsdf.inputs["Roughness"].default_value = (0.1, 0.1, 0.1, 1), 1.0, 0.1
    obj.data.materials.append(mat)
    return obj

import bpy
import math
import mathutils

def create_hologram(location, size=1.0):
    """Creates a holographic interface."""
    bpy.ops.mesh.primitive_plane_add(size=size, location=location + mathutils.Vector((0,0,1.2)), rotation=(math.radians(90), 0, 0))
    holo = bpy.context.object
    holo.name = "Hologram"

    mat = bpy.data.materials.new(name="HoloMat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0, 0.5, 1, 1)
    bsdf.inputs["Emission Color"].default_value = (0, 0.8, 1, 1)
    bsdf.inputs["Emission Strength"].default_value = 5.0
    bsdf.inputs["Alpha"].default_value = 0.3
    mat.blend_method = 'BLEND'
    holo.data.materials.append(mat)

    return holo

def create_lab_bench(location):
    """Creates a futuristic laboratory table."""
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location + mathutils.Vector((0,0,0.4)))
    bench = bpy.context.object
    bench.name = "LabBench"
    bench.scale = (2.0, 1.0, 0.4)

    mat = bpy.data.materials.new(name="BenchMat")
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.1, 0.1, 0.1, 1)
    mat.node_tree.nodes["Principled BSDF"].inputs["Metallic"].default_value = 1.0
    mat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.1
    bench.data.materials.append(mat)

    return bench

if __name__ == "__main__":
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    create_lab_bench(mathutils.Vector((0,0,0)))
    create_hologram(mathutils.Vector((0,0,0)))

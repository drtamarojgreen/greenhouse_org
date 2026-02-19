import bpy
import math
import mathutils
import style

def create_wood_material(name, color=(0.15, 0.08, 0.05)):
    """Point 32: Refactored to use style helper."""
    colors = [(*[c*0.6 for c in color], 1), (*color, 1)]
    return style.create_noise_based_material(name, colors, noise_type='WAVE', noise_scale=5.0, roughness=0.3)

def create_pedestal(location, height=1.2):
    """Point 95: BMesh Pedestal creation."""
    import bmesh
    mesh_data = bpy.data.meshes.new("Pedestal_MeshData")
    obj = bpy.data.objects.new("Pedestal", mesh_data)
    bpy.context.collection.objects.link(obj)
    obj.location = location

    bm = bmesh.new()
    matrix = mathutils.Matrix.Translation((0, 0, height/2))
    ret = bmesh.ops.create_cube(bm, size=1.0, matrix=matrix)
    for v in ret['verts']:
        v.co.x *= 0.5
        v.co.y *= 0.5
        v.co.z *= height/2

    bm.to_mesh(mesh_data)
    bm.free()

    mat = create_wood_material("PedestalMat")
    obj.data.materials.append(mat)
    return obj

def create_paper_material(name):
    """Point 32: Refactored to use style helper."""
    colors = [(0.8, 0.7, 0.5, 1), (0.95, 0.9, 0.8, 1)]
    return style.create_noise_based_material(name, colors, noise_type='NOISE', noise_scale=12.0, roughness=0.8)

def create_open_book(location):
    """Point 95: BMesh Open Book creation."""
    import bmesh
    mesh_data = bpy.data.meshes.new("Book_MeshData")
    obj = bpy.data.objects.new("Book", mesh_data)
    bpy.context.collection.objects.link(obj)
    obj.location = location

    bm = bmesh.new()
    # Left Page
    mat_l = mathutils.Matrix.Translation((-0.5, 0, 0.1)) @ mathutils.Euler((0, math.radians(-10), 0)).to_matrix().to_4x4()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5, matrix=mat_l)
    
    # Right Page
    mat_r = mathutils.Matrix.Translation((0.5, 0, 0.1)) @ mathutils.Euler((0, math.radians(10), 0)).to_matrix().to_4x4()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5, matrix=mat_r)

    bm.to_mesh(mesh_data)
    bm.free()

    mat = create_paper_material("PageMat")
    obj.data.materials.append(mat)
    return obj

if __name__ == "__main__":
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    create_pedestal(mathutils.Vector((0,0,0)))
    create_open_book(mathutils.Vector((0,0,1.2)))

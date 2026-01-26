import bpy
import math
import random
import mathutils

def create_leaf_mesh():
    """Creates a simple leaf mesh if it doesn't exist."""
    if "LeafTemplate" in bpy.data.meshes:
        return bpy.data.objects.new("Leaf", bpy.data.meshes["LeafTemplate"])

    mesh = bpy.data.meshes.new("LeafTemplate")
    obj = bpy.data.objects.new("LeafTemplate", mesh)

    import bmesh
    bm = bmesh.new()
    # Create a diamond-like leaf
    v1 = bm.verts.new((0, 0, 0))
    v2 = bm.verts.new((0.2, 0.5, 0))
    v3 = bm.verts.new((0, 1, 0))
    v4 = bm.verts.new((-0.2, 0.5, 0))
    bm.faces.new((v1, v2, v3, v4))

    bm.to_mesh(mesh)
    bm.free()
    return obj

def create_vine(start, end, radius=0.05):
    """Creates a vine segment between two points."""
    curve_data = bpy.data.curves.new('VineCurve', type='CURVE')
    curve_data.dimensions = '3D'
    curve_data.fill_mode = 'FULL'
    curve_data.bevel_depth = radius
    curve_data.bevel_resolution = 3

    polyline = curve_data.splines.new('POLY')
    polyline.points.add(1)

    # Add some mid-point for curvature
    mid = (start + end) / 2
    mid += mathutils.Vector((random.uniform(-0.1, 0.1), random.uniform(-0.1, 0.1), random.uniform(-0.1, 0.1)))

    polyline.points.add(1) # Add a third point
    polyline.points[0].co = (start.x, start.y, start.z, 1)
    polyline.points[1].co = (mid.x, mid.y, mid.z, 1)
    polyline.points[2].co = (end.x, end.y, end.z, 1)

    obj = bpy.data.objects.new('Vine', curve_data)
    bpy.context.collection.objects.link(obj)
    return obj

def create_plant_humanoid(name, location):
    """Generates a humanoid plant character."""
    container = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(container)

    # Torso (Trunk)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.2, depth=1.5, location=location + mathutils.Vector((0,0,0.75)))
    torso = bpy.context.object
    torso.name = f"{name}_Torso"

    # Head (Leafy)
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.4, location=location + mathutils.Vector((0,0,1.8)))
    head = bpy.context.object
    head.name = f"{name}_Head"

    # Arms (Vines)
    left_arm = create_vine(location + mathutils.Vector((0.2, 0, 1.4)), location + mathutils.Vector((0.8, 0, 1.0)))
    right_arm = create_vine(location + mathutils.Vector((-0.2, 0, 1.4)), location + mathutils.Vector((-0.8, 0, 1.0)))

    # Legs (Roots)
    left_leg = create_vine(location + mathutils.Vector((0.1, 0, 0.1)), location + mathutils.Vector((0.3, 0, -0.8)), radius=0.08)
    right_leg = create_vine(location + mathutils.Vector((-0.1, 0, 0.1)), location + mathutils.Vector((-0.3, 0, -0.8)), radius=0.08)

    # Add leaves to the head
    leaf_template = create_leaf_mesh()
    for i in range(12):
        leaf = bpy.data.objects.new(f"{name}_Leaf_{i}", leaf_template.data)
        container.objects.link(leaf)
        angle = (i / 12) * math.pi * 2
        leaf.location = head.location + mathutils.Vector((math.cos(angle)*0.4, math.sin(angle)*0.4, random.uniform(-0.2, 0.2)))
        leaf.rotation_euler = (random.uniform(0, 3.14), random.uniform(0, 3.14), angle)

    # Cleanup and Material
    mat = bpy.data.materials.new(name=f"PlantMat_{name}")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.1, 0.5, 0.1, 1) # Green

    parts = [torso, head, left_arm, right_arm, left_leg, right_leg]
    for p in parts:
        if p.name not in container.objects:
            container.objects.link(p)

        # Convert to mesh if curve
        if p.type == 'CURVE':
            bpy.ops.object.select_all(action='DESELECT')
            p.select_set(True)
            bpy.context.view_layer.objects.active = p
            bpy.ops.object.convert(target='MESH')

        p.data.materials.append(mat)

    return torso # Return torso as main handle

if __name__ == "__main__":
    # Clear scene for testing
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    create_plant_humanoid("Herbaceous", mathutils.Vector((0, 0, 0)))
    create_plant_humanoid("Arbor", mathutils.Vector((2, 0, 0)))

    # Save for verification if needed
    # bpy.ops.wm.save_as_mainfile(filepath="plant_test.blend")

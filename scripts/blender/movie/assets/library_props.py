import bpy
import math
import mathutils

def create_pedestal(location, height=1.2):
    """Creates a stone pedestal for the book."""
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location + mathutils.Vector((0,0,height/2)))
    pedestal = bpy.context.object
    pedestal.name = "Pedestal"
    pedestal.scale = (0.5, 0.5, height/2)

    mat = bpy.data.materials.new(name="PedestalMat")
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.2, 0.2, 0.2, 1)
    pedestal.data.materials.append(mat)
    return pedestal

def create_open_book(location):
    """Creates a large open book asset."""
    container = bpy.data.objects.new("BookContainer", None)
    bpy.context.scene.collection.objects.link(container)
    container.location = location

    # Left Page
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=location + mathutils.Vector((-0.5, 0, 0.1)))
    left = bpy.context.object
    left.name = "Page_Left"
    left.rotation_euler = (0, math.radians(-10), 0)
    left.parent = container
    left.matrix_parent_inverse = container.matrix_world.inverted()

    # Right Page
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=location + mathutils.Vector((0.5, 0, 0.1)))
    right = bpy.context.object
    right.name = "Page_Right"
    right.rotation_euler = (0, math.radians(10), 0)
    right.parent = container
    right.matrix_parent_inverse = container.matrix_world.inverted()

    # Material
    mat = bpy.data.materials.new(name="PageMat")
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.9, 0.85, 0.7, 1)
    left.data.materials.append(mat)
    right.data.materials.append(mat)

    return container

if __name__ == "__main__":
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    create_pedestal(mathutils.Vector((0,0,0)))
    create_open_book(mathutils.Vector((0,0,1.2)))

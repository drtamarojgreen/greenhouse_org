import bpy
import math
import mathutils
import style

def create_wood_material(name, color=(0.15, 0.08, 0.05)):
    """Point 32: Refactored to use style helper."""
    colors = [(*[c*0.6 for c in color], 1), (*color, 1)]
    return style.create_noise_based_material(name, colors, noise_type='WAVE', noise_scale=5.0, roughness=0.3)

def create_pedestal(location, height=1.2):
    location = mathutils.Vector(location)
    """Creates a stone or wood pedestal for the book."""
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location + mathutils.Vector((0,0,height/2)))
    pedestal = bpy.context.object
    pedestal.name = "Pedestal"
    pedestal.scale = (0.5, 0.5, height/2)

    mat = create_wood_material("PedestalMat")
    pedestal.data.materials.append(mat)
    return pedestal

def create_paper_material(name):
    """Point 32: Refactored to use style helper."""
    colors = [(0.8, 0.7, 0.5, 1), (0.95, 0.9, 0.8, 1)]
    return style.create_noise_based_material(name, colors, noise_type='NOISE', noise_scale=12.0, roughness=0.8)

def create_open_book(location):
    location = mathutils.Vector(location)
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
    mat = create_paper_material("PageMat")
    left.data.materials.append(mat)
    right.data.materials.append(mat)

    return container

if __name__ == "__main__":
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    create_pedestal(mathutils.Vector((0,0,0)))
    create_open_book(mathutils.Vector((0,0,1.2)))

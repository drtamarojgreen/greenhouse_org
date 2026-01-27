import bpy
import math
import mathutils
import random

def create_gnome(name, location, scale=0.6):
    """Generates a gnome character as an antagonist."""
    container = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(container)

    # Body (Cylinder)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.3, depth=0.8, location=location + mathutils.Vector((0,0,0.4)))
    body = bpy.context.object
    body.name = f"{name}_Body"

    # Hat (Pointy Cone)
    bpy.ops.mesh.primitive_cone_add(radius1=0.35, depth=0.7, location=location + mathutils.Vector((0,0,1.15)))
    hat = bpy.context.object
    hat.name = f"{name}_Hat"
    hat.parent = body
    hat.matrix_parent_inverse = body.matrix_world.inverted()

    # Beard (Cone)
    bpy.ops.mesh.primitive_cone_add(radius1=0.2, depth=0.4, location=location + mathutils.Vector((0,-0.2,0.7)), rotation=(math.radians(-30),0,0))
    beard = bpy.context.object
    beard.name = f"{name}_Beard"
    beard.parent = body
    beard.matrix_parent_inverse = body.matrix_world.inverted()

    # Red Glowing Eyes
    mat_gnome_eye = bpy.data.materials.new(name=f"{name}_MatEye")
    mat_gnome_eye.use_nodes = True
    mat_gnome_eye.node_tree.nodes["Principled BSDF"].inputs["Emission Color"].default_value = (1, 0, 0, 1)
    mat_gnome_eye.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 10.0

    for side in [-1, 1]:
        eye_loc = location + mathutils.Vector((side * 0.15, -0.25, 0.85))
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.04, location=eye_loc)
        eye = bpy.context.object
        eye.name = f"{name}_Eye_{'L' if side < 0 else 'R'}"
        eye.parent = body
        eye.matrix_parent_inverse = body.matrix_world.inverted()
        eye.data.materials.append(mat_gnome_eye)

    # Gloom Staff
    bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=1.5, location=location + mathutils.Vector((0.5, -0.3, 0.75)))
    staff = bpy.context.object
    staff.name = f"{name}_Staff"
    staff.parent = body
    staff.matrix_parent_inverse = body.matrix_world.inverted()

    # Staff Head (Gloom Orb)
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.15, location=location + mathutils.Vector((0.5, -0.3, 1.55)))
    orb = bpy.context.object
    orb.name = f"{name}_GloomOrb"
    orb.parent = staff
    orb.matrix_parent_inverse = staff.matrix_world.inverted()

    # Materials
    mat_body = bpy.data.materials.new(name=f"{name}_MatBody")
    mat_body.use_nodes = True
    mat_body.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.2, 0.1, 0.3, 1) # Dark purple

    mat_hat = bpy.data.materials.new(name=f"{name}_MatHat")
    mat_hat.use_nodes = True
    mat_hat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.1, 0.05, 0.2, 1) # Deep navy

    mat_beard = bpy.data.materials.new(name=f"{name}_MatBeard")
    mat_beard.use_nodes = True
    mat_beard.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.8, 0.8, 0.8, 1) # White

    mat_gloom = bpy.data.materials.new(name=f"{name}_MatGloom")
    mat_gloom.use_nodes = True
    mat_gloom.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0, 0, 0, 1) # Black
    mat_gloom.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 0.5
    mat_gloom.node_tree.nodes["Principled BSDF"].inputs["Emission Color"].default_value = (0.1, 0, 0.2, 1)

    parts = [(body, mat_body), (hat, mat_hat), (beard, mat_beard), (staff, mat_gloom), (orb, mat_gloom)]
    for p, mat in parts:
        if p.name not in container.objects:
            container.objects.link(p)
        if not p.material_slots:
            p.data.materials.append(None)
        p.material_slots[0].link = 'OBJECT'
        p.material_slots[0].material = mat

    body.scale = (scale, scale, scale)
    return body

if __name__ == "__main__":
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    create_gnome("GloomGnome", mathutils.Vector((0, 0, 0)))

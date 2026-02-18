import bpy
import math
import mathutils
import random

def create_gnarled_staff(location, height=1.5, name="GnarledStaff", material=None):
    """Creates a gnarled staff using randomized segments."""
    container = bpy.data.objects.new(f"{name}_Container", None)
    bpy.context.scene.collection.objects.link(container)
    container.location = location

    curr_loc = location
    segments = []

    for i in range(8):
        next_loc = curr_loc + mathutils.Vector((random.uniform(-0.05, 0.05), random.uniform(-0.05, 0.05), height/8))
        bpy.ops.mesh.primitive_cylinder_add(radius=0.03, depth=(next_loc - curr_loc).length + 0.02, location=(curr_loc + next_loc)/2)
        seg = bpy.context.object
        seg.name = f"StaffSeg_{i}"

        # Orient segment
        direction = (next_loc - curr_loc).normalized()
        seg.rotation_euler = direction.to_track_quat('Z', 'Y').to_euler()

        seg.parent = container
        seg.matrix_parent_inverse = container.matrix_world.inverted()
        if material: seg.data.materials.append(material)
        curr_loc = next_loc
        segments.append(seg)

    return container, curr_loc

def create_gnome(name, location, scale=0.6):
    """Generates a gnome character as an antagonist."""
    container = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(container)

    # Point 12: Create materials first
    mat_body = bpy.data.materials.new(name=f"{name}_MatBody")
    mat_body.use_nodes = True
    mat_body.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.2, 0.1, 0.3, 1)

    mat_hat = bpy.data.materials.new(name=f"{name}_MatHat")
    mat_hat.use_nodes = True
    mat_hat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.1, 0.05, 0.2, 1)

    mat_beard = bpy.data.materials.new(name=f"{name}_MatBeard")
    mat_beard.use_nodes = True
    mat_beard.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.8, 0.8, 0.8, 1)

    mat_gloom = bpy.data.materials.new(name=f"{name}_MatGloom")
    mat_gloom.use_nodes = True
    bsdf_gloom = mat_gloom.node_tree.nodes["Principled BSDF"]
    bsdf_gloom.inputs["Base Color"].default_value = (0, 0, 0, 1)
    import style
    style.set_principled_socket(mat_gloom, "Emission Strength", 0.5)
    style.set_principled_socket(mat_gloom, "Emission", (0.1, 0, 0.2, 1))

    node_rust = mat_gloom.node_tree.nodes.new(type='ShaderNodeTexNoise')
    node_rust.inputs['Scale'].default_value = 50.0
    # Blender 5.0 Float sockets
    node_rust_rgb2bw = mat_gloom.node_tree.nodes.new(type='ShaderNodeRGBToBW')
    mat_gloom.node_tree.links.new(node_rust.outputs['Fac'], node_rust_rgb2bw.inputs['Color'])
    mat_gloom.node_tree.links.new(node_rust_rgb2bw.outputs['Val'], bsdf_gloom.inputs['Roughness'])

    node_runes = mat_gloom.node_tree.nodes.new(type='ShaderNodeTexNoise')
    node_runes.inputs['Scale'].default_value = 15.0
    node_runes_color = mat_gloom.node_tree.nodes.new(type='ShaderNodeValToRGB')
    node_runes_color.color_ramp.elements[0].position = 0.5
    node_runes_color.color_ramp.elements[0].color = (0, 0, 0, 1)
    node_runes_color.color_ramp.elements[1].color = (1, 0.2, 0.8, 1)
    mat_gloom.node_tree.links.new(node_runes.outputs['Fac'], node_runes_color.inputs['Fac'])

    # Point 75: Alias-aware linking
    emission_sock = bsdf_gloom.inputs.get("Emission") or bsdf_gloom.inputs.get("Emission Color")
    if emission_sock:
        mat_gloom.node_tree.links.new(node_runes_color.outputs['Color'], emission_sock)

    # Body (Cylinder)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.3, depth=0.8, location=location + mathutils.Vector((0,0,0.4)))
    body = bpy.context.object
    body.name = f"{name}_Torso"

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
    style.set_principled_socket(mat_gnome_eye, 'Emission', (1, 0, 0, 1))
    style.set_principled_socket(mat_gnome_eye, 'Emission Strength', 10.0)

    for side in [-1, 1]:
        eye_loc = location + mathutils.Vector((side * 0.15, -0.25, 0.85))
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.04, location=eye_loc)
        eye = bpy.context.object
        eye.name = f"{name}_Eye_{'L' if side < 0 else 'R'}"
        eye.parent = body
        eye.matrix_parent_inverse = body.matrix_world.inverted()
        eye.data.materials.append(mat_gnome_eye)

    # Mouth Crevice
    bpy.ops.mesh.primitive_cube_add(size=0.1, location=location + mathutils.Vector((0, -0.28, 0.6)))
    mouth = bpy.context.object
    mouth.name = f"{name}_Mouth"
    mouth.scale = (1.5, 0.1, 0.2)
    mouth.parent = body
    mouth.matrix_parent_inverse = body.matrix_world.inverted()
    mouth.data.materials.append(mat_gnome_eye) # Reuse red glow

    # Gloom Staff (Gnarled)
    staff_base = location + mathutils.Vector((0.5, -0.3, 0))
    staff, staff_tip = create_gnarled_staff(staff_base, name=f"{name}_Staff", material=mat_gloom)
    staff.parent = body
    staff.matrix_parent_inverse = body.matrix_world.inverted()

    # Staff Head (Gloom Orb)
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.15, location=staff_tip)
    orb = bpy.context.object
    orb.name = f"{name}_GloomOrb"
    orb.parent = staff
    orb.matrix_parent_inverse = staff.matrix_world.inverted()


    # Tattered Cloak (Woven Cloak)
    bpy.ops.mesh.primitive_plane_add(size=1.0, location=location + mathutils.Vector((0, 0.2, 0.5)), rotation=(math.radians(90), 0, 0))
    cloak = bpy.context.object
    cloak.name = f"{name}_Cloak"
    cloak.scale = (0.6, 0.8, 1.0)
    cloak.parent = body
    cloak.matrix_parent_inverse = body.matrix_world.inverted()

    mat_cloak = bpy.data.materials.new(name=f"{name}_MatCloak")
    mat_cloak.use_nodes = True
    bsdf_cloak = mat_cloak.node_tree.nodes["Principled BSDF"]
    bsdf_cloak.inputs["Base Color"].default_value = (0.1, 0.05, 0.2, 1)

    # Woven Fabric (Voronoi/Wave with Bump)
    node_weave = mat_cloak.node_tree.nodes.new(type='ShaderNodeTexWave')
    node_weave.inputs['Scale'].default_value = 100.0
    node_bump = mat_cloak.node_tree.nodes.new(type='ShaderNodeBump')
    node_bump.inputs['Strength'].default_value = 0.3
    mat_cloak.node_tree.links.new(node_weave.outputs['Fac'], node_bump.inputs['Height'])
    mat_cloak.node_tree.links.new(node_bump.outputs['Normal'], bsdf_cloak.inputs['Normal'])

    cloak.data.materials.append(mat_cloak)
    style.set_blend_method(mat_cloak, 'BLEND')

    # Point 85: Wave modifier for cloak secondary motion
    wave = cloak.modifiers.new(name="CloakWave", type='WAVE')
    wave.use_x = True
    wave.use_y = True
    wave.height = 0.05
    wave.width = 0.5
    wave.speed = 0.02

    # Point 28: Merge static parts to reduce draw calls
    # Assign materials before joining
    hat.data.materials.append(mat_hat)
    beard.data.materials.append(mat_beard)
    mouth.data.materials.append(mat_gnome_eye)
    # cloak already has mat_cloak
    body.data.materials.append(mat_body)

    static_parts = [hat, beard, mouth, cloak]
    bpy.ops.object.select_all(action='DESELECT')
    for p in static_parts:
        p.select_set(True)
    body.select_set(True)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.join()

    # Staff orb
    orb.data.materials.append(mat_gloom)

    parts = [(body, None), (orb, None)] # Materials already appended to data
    for p, _ in parts:
        if p.name not in container.objects:
            container.objects.link(p)

    body.scale = (scale, scale, scale)
    return body

if __name__ == "__main__":
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    create_gnome("GloomGnome", mathutils.Vector((0, 0, 0)))

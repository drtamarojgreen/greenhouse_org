import bpy
import math
import mathutils
import random

def create_gnarled_staff(location, height=1.5, name="GnarledStaff", material=None):
    """Point 91: BMesh gnarled staff creation."""
    import bmesh
    mesh_data = bpy.data.meshes.new(f"{name}_MeshData")
    obj = bpy.data.objects.new(name, mesh_data)
    bpy.context.collection.objects.link(obj)
    obj.location = location

    bm = bmesh.new()
    curr_loc = mathutils.Vector((0,0,0))
    for i in range(8):
        next_loc = curr_loc + mathutils.Vector((random.uniform(-0.05, 0.05), random.uniform(-0.05, 0.05), height/8))
        segment_center = (curr_loc + next_loc) / 2
        segment_vec = next_loc - curr_loc
        segment_len = segment_vec.length

        # Matrix to orient cylinder
        direction = segment_vec.normalized()
        rot = direction.to_track_quat('Z', 'Y').to_matrix().to_4x4()
        matrix = mathutils.Matrix.Translation(segment_center) @ rot

        bmesh.ops.create_cylinder(bm, segments=8, radius=0.03, depth=segment_len + 0.02, matrix=matrix)
        curr_loc = next_loc

    bm.to_mesh(mesh_data)
    bm.free()
    if material: obj.data.materials.append(material)

    return obj, location + curr_loc

def create_gnome(name, location, scale=0.6):
    """Point 95: BMesh Gnome with Proper Rigging."""
    location = mathutils.Vector(location)
    import bmesh
    import style

    # 1. Armature
    armature_data = bpy.data.armatures.new(f"{name}_ArmatureData")
    armature_obj = bpy.data.objects.new(name, armature_data)
    bpy.context.collection.objects.link(armature_obj)
    armature_obj.location = location

    bpy.context.view_layer.objects.active = armature_obj
    bpy.ops.object.mode_set(mode='EDIT')

    root = armature_data.edit_bones.new("Root")
    root.head = (0, 0, 0)
    root.tail = (0, 0, 0.1)

    torso = armature_data.edit_bones.new("Torso")
    torso.head = (0, 0, 0)
    torso.tail = (0, 0, 0.8)
    torso.parent = root

    head = armature_data.edit_bones.new("Head")
    head.head = (0, 0, 0.8)
    head.tail = (0, 0, 1.2)
    head.parent = torso

    bpy.ops.object.mode_set(mode='OBJECT')

    # 2. Mesh
    mesh_data = bpy.data.meshes.new(f"{name}_MeshData")
    mesh_obj = bpy.data.objects.new(f"{name}_Mesh", mesh_data)
    bpy.context.collection.objects.link(mesh_obj)
    mesh_obj.parent = armature_obj

    bm = bmesh.new()
    dlayer = bm.verts.layers.deform.verify()
    vg_torso = mesh_obj.vertex_groups.new(name="Torso").index
    vg_head = mesh_obj.vertex_groups.new(name="Head").index

    # Body
    ret = bmesh.ops.create_cylinder(bm, segments=12, radius=0.3, depth=0.8, matrix=mathutils.Matrix.Translation((0,0,0.4)))
    for v in ret['verts']: v[dlayer][vg_torso] = 1.0
    for f in ret['faces']: f.material_index = 0 # mat_body

    # Hat
    ret = bmesh.ops.create_cone(bm, segments=12, cap_ends=True, radius1=0.35, radius2=0, depth=0.7, matrix=mathutils.Matrix.Translation((0,0,1.15)))
    for v in ret['verts']: v[dlayer][vg_head] = 1.0
    for f in ret['faces']: f.material_index = 1 # mat_hat

    # Beard
    rot_beard = mathutils.Euler((math.radians(-30), 0, 0)).to_matrix().to_4x4()
    mat_beard_loc = mathutils.Matrix.Translation((0,-0.2,0.7)) @ rot_beard
    ret = bmesh.ops.create_cone(bm, segments=8, cap_ends=True, radius1=0.2, radius2=0, depth=0.4, matrix=mat_beard_loc)
    for v in ret['verts']: v[dlayer][vg_head] = 1.0
    for f in ret['faces']: f.material_index = 2 # mat_beard

    # Eyes
    for side in [-1, 1]:
        loc = (side * 0.15, -0.25, 0.85)
        ret = bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=8, radius=0.04, matrix=mathutils.Matrix.Translation(loc))
        for v in ret['verts']: v[dlayer][vg_head] = 1.0
        for f in ret['faces']: f.material_index = 4 # mat_eye

    # Mouth
    ret = bmesh.ops.create_cube(bm, size=0.1, matrix=mathutils.Matrix.Translation((0, -0.28, 0.6)))
    for v in ret['verts']:
        # Apply scaling to make it a crevice
        v.co.x *= 1.5
        v.co.y *= 0.1
        v.co.z *= 0.2
        v[dlayer][vg_head] = 1.0
    for f in ret['faces']: f.material_index = 4 # Reuse red glow for mouth

    # Materials
    mat_body = bpy.data.materials.new(name=f"{name}_MatBody")
    mat_body.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.2, 0.1, 0.3, 1)

    mat_hat = bpy.data.materials.new(name=f"{name}_MatHat")
    mat_hat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.1, 0.05, 0.2, 1)

    mat_beard = bpy.data.materials.new(name=f"{name}_MatBeard")
    mat_beard.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.8, 0.8, 0.8, 1)

    mat_gloom = bpy.data.materials.new(name=f"{name}_MatGloom")
    style.set_principled_socket(mat_gloom, "Emission Strength", 0.5)
    style.set_principled_socket(mat_gloom, "Emission", (0.1, 0, 0.2, 1))

    mat_eye = bpy.data.materials.new(name=f"{name}_MatEye")
    style.set_principled_socket(mat_eye, 'Emission', (1, 0, 0, 1))
    style.set_principled_socket(mat_eye, 'Emission Strength', 10.0)

    for m in [mat_body, mat_hat, mat_beard, mat_gloom, mat_eye]:
        mesh_obj.data.materials.append(m)

    bm.to_mesh(mesh_data)
    bm.free()

    # Staff
    staff_base = (0.5, -0.3, 0)
    staff, staff_tip = create_gnarled_staff(location + mathutils.Vector(staff_base), name=f"{name}_Staff", material=mat_gloom)
    staff.parent = armature_obj # Parent to armature instead of torso object

    # Orb
    orb_data = bpy.data.meshes.new(f"{name}_OrbData")
    orb = bpy.data.objects.new(f"{name}_GloomOrb", orb_data)
    bpy.context.collection.objects.link(orb)
    orb.location = staff_tip
    bm_orb = bmesh.new()
    bmesh.ops.create_uvsphere(bm_orb, u_segments=12, v_segments=12, radius=0.15)
    bm_orb.to_mesh(orb_data)
    bm_orb.free()
    orb.data.materials.append(mat_gloom)
    orb.parent = staff

    # Armature Modifier
    mod = mesh_obj.modifiers.new(name="Armature", type='ARMATURE')
    mod.object = armature_obj

    armature_obj.scale = (scale, scale, scale)
    return armature_obj

if __name__ == "__main__":
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    create_gnome("GloomGnome", mathutils.Vector((0, 0, 0)))

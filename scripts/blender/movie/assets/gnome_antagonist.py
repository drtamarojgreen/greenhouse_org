import bpy
import math
import mathutils
import random

def create_gnarled_staff(location, height=1.5, name="GnarledStaff", material=None):
    """Exclusive 5.0+ BMesh gnarled staff creation."""
    import bmesh
    mesh_data = bpy.data.meshes.new(f"{name}_MeshData")
    obj = bpy.data.objects.new(name, mesh_data)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location

    bm = bmesh.new()
    curr_loc = mathutils.Vector((0,0,0))
    for i in range(8):
        next_loc = curr_loc + mathutils.Vector((random.uniform(-0.05, 0.05), random.uniform(-0.05, 0.05), height/8))
        segment_center = (curr_loc + next_loc) / 2
        segment_vec = next_loc - curr_loc
        rot = segment_vec.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
        matrix = mathutils.Matrix.Translation(segment_center) @ rot
        bmesh.ops.create_cone(bm, segments=8, cap_ends=True, radius1=0.03, radius2=0.03, depth=segment_vec.length + 0.02, matrix=matrix)
        curr_loc = next_loc

    bm.to_mesh(mesh_data); bm.free()
    if material: obj.data.materials.append(material)
    return obj, mathutils.Vector(location) + curr_loc

def create_gnome(name, location, scale=0.6):
    """Exclusive 5.0+ BMesh Gnome with Proper Rigging."""
    location = mathutils.Vector(location)
    import bmesh; import style

    armature_data = bpy.data.armatures.new(f"{name}_ArmatureData")
    armature_obj = bpy.data.objects.new(name, armature_data)
    bpy.context.scene.collection.objects.link(armature_obj); armature_obj.location = location

    bpy.context.view_layer.objects.active = armature_obj; bpy.ops.object.mode_set(mode='EDIT')
    
    root = armature_data.edit_bones.new("Root"); root.head, root.tail = (0,0,0), (0,0,0.1)
    torso = armature_data.edit_bones.new("Torso"); torso.head, torso.tail, torso.parent = (0,0,0), (0,0,0.8), root
    neck = armature_data.edit_bones.new("Neck"); neck.head, neck.tail, neck.parent = (0,0,0.8), (0,0,0.9), torso
    head = armature_data.edit_bones.new("Head"); head.head, head.tail, head.parent = (0,0,0.9), (0,0,1.2), neck
    jaw = armature_data.edit_bones.new("Jaw"); jaw.head, jaw.tail, jaw.parent = (0,-0.1,0.95), (0,-0.25,0.9), head
    mouth = armature_data.edit_bones.new("Mouth"); mouth.head, mouth.tail, mouth.parent = (0,-0.25,0.9), (0,-0.3,0.9), jaw
    brow_l = armature_data.edit_bones.new("Brow.L"); brow_l.head, brow_l.tail, brow_l.parent = (0.1, -0.2, 1.0), (0.2, -0.2, 1.05), head
    brow_r = armature_data.edit_bones.new("Brow.R"); brow_r.head, brow_r.tail, brow_r.parent = (-0.1, -0.2, 1.0), (-0.2, -0.2, 1.05), head
    eye_l = armature_data.edit_bones.new("Eye.L"); eye_l.head, eye_l.tail, eye_l.parent = (0.15,-0.25,0.85), (0.15,-0.3,0.85), head
    eye_r = armature_data.edit_bones.new("Eye.R"); eye_r.head, eye_r.tail, eye_r.parent = (-0.15,-0.25,0.85), (-0.15,-0.3,0.85), head
    arm_l = armature_data.edit_bones.new("Arm.L"); arm_l.head, arm_l.tail, arm_l.parent = (0.3,0,0.6), (0.6,0,0.3), torso
    arm_r = armature_data.edit_bones.new("Arm.R"); arm_r.head, arm_r.tail, arm_r.parent = (-0.3,0,0.6), (-0.6,0,0.3), torso
    leg_l = armature_data.edit_bones.new("Leg.L"); leg_l.head, leg_l.tail, leg_l.parent = (0.15,0,0), (0.15,0,-0.3), root
    leg_r = armature_data.edit_bones.new("Leg.R"); leg_r.head, leg_r.tail, leg_r.parent = (-0.15,0,0), (-0.15,0,-0.3), root

    bpy.ops.object.mode_set(mode='OBJECT')
    for pb in armature_obj.pose.bones: pb.rotation_mode = 'XYZ'

    mesh_data = bpy.data.meshes.new(f"{name}_MeshData")
    mesh_obj = bpy.data.objects.new(f"{name}_Torso", mesh_data); bpy.context.scene.collection.objects.link(mesh_obj); mesh_obj.parent = armature_obj

    bm = bmesh.new(); dlayer = bm.verts.layers.deform.verify()
    vgs = ["Torso", "Neck", "Head", "Jaw", "Mouth", "Brow.L", "Brow.R", "Eye.L", "Eye.R", "Arm.L", "Arm.R", "Leg.L", "Leg.R"]
    vg_indices = {n: mesh_obj.vertex_groups.new(name=n).index for n in vgs}

    # Body
    ret = bmesh.ops.create_cone(bm, segments=12, cap_ends=True, radius1=0.3, radius2=0.3, depth=0.8, matrix=mathutils.Matrix.Translation((0,0,0.4)))
    for v in ret['verts']: v[dlayer][vg_indices["Torso"]] = 1.0
    for f in {f for v in ret['verts'] for f in v.link_faces}: f.material_index = 0

    # Neck
    ret = bmesh.ops.create_cone(bm, segments=12, cap_ends=True, radius1=0.15, radius2=0.15, depth=0.1, matrix=mathutils.Matrix.Translation((0,0,0.85)))
    for v in ret['verts']: v[dlayer][vg_indices["Neck"]] = 1.0
    for f in {f for v in ret['verts'] for f in v.link_faces}: f.material_index = 0

    # Hat
    ret = bmesh.ops.create_cone(bm, segments=12, cap_ends=True, radius1=0.35, radius2=0, depth=0.7, matrix=mathutils.Matrix.Translation((0,0,1.15)))
    for v in ret['verts']: v[dlayer][vg_indices["Head"]] = 1.0
    for f in {f for v in ret['verts'] for f in v.link_faces}: f.material_index = 1

    # Beard
    rot_beard = mathutils.Euler((math.radians(-30), 0, 0)).to_matrix().to_4x4()
    ret = bmesh.ops.create_cone(bm, segments=8, cap_ends=True, radius1=0.2, radius2=0, depth=0.4, matrix=mathutils.Matrix.Translation((0,-0.2,0.7)) @ rot_beard)
    for v in ret['verts']: v[dlayer][vg_indices["Head"]] = 1.0
    for f in {f for v in ret['verts'] for f in v.link_faces}: f.material_index = 2

    # Eyes
    for side, vg_name in [(1, "Eye.L"), (-1, "Eye.R")]:
        ret = bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=8, radius=0.04, matrix=mathutils.Matrix.Translation((side * 0.15, -0.25, 0.85)))
        for v in ret['verts']: v[dlayer][vg_indices[vg_name]] = 1.0
        for f in {f for v in ret['verts'] for f in v.link_faces}: f.material_index = 4
    
    # Brows
    for side in [1, -1]:
        ret = bmesh.ops.create_cube(bm, matrix=mathutils.Matrix.Translation((side * 0.15, -0.2, 1.0)))
        vg_name = "Brow.L" if side == 1 else "Brow.R"
        for v in ret['verts']: 
            v.co.x, v.co.y, v.co.z = v.co.x * 0.05, v.co.y * 0.01, v.co.z * 0.01; v[dlayer][vg_indices[vg_name]] = 1.0
        for f in {f for v in ret['verts'] for f in v.link_faces}: f.material_index = 2

    # Mouth
    ret = bmesh.ops.create_cube(bm, size=0.1, matrix=mathutils.Matrix.Translation((0, -0.28, 0.9)))
    for v in ret['verts']: 
        v.co.x, v.co.y, v.co.z = v.co.x * 1.5, v.co.y * 0.1, v.co.z * 0.2; v[dlayer][vg_indices["Mouth"]] = 1.0

    # Legs
    for side, vg_name in [(0.15, "Leg.L"), (-0.15, "Leg.R")]:
        ret = bmesh.ops.create_cone(bm, segments=8, cap_ends=True, radius1=0.1, radius2=0.08, depth=0.3, matrix=mathutils.Matrix.Translation((side, 0, -0.15)))
        for v in ret['verts']: v[dlayer][vg_indices[vg_name]] = 1.0
        for f in {f for v in ret['verts'] for f in v.link_faces}: f.material_index = 0

    # Arm R
    ret = bmesh.ops.create_cone(bm, segments=8, cap_ends=True, radius1=0.08, radius2=0.06, depth=0.4, matrix=mathutils.Matrix.Translation((-0.45, 0, 0.45)) @ mathutils.Euler((0, math.radians(45), 0)).to_matrix().to_4x4())
    for v in ret['verts']: v[dlayer][vg_indices["Arm.R"]] = 1.0
    for f in {f for v in ret['verts'] for f in v.link_faces}: f.material_index = 0

    # Staff
    curr_loc = mathutils.Vector((0.6, 0, 0.3))
    for i in range(8):
        next_loc = curr_loc + mathutils.Vector((random.uniform(-0.05, 0.05), random.uniform(-0.05, 0.05), 1.5/8))
        segment_vec = next_loc - curr_loc; rot = segment_vec.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
        ret = bmesh.ops.create_cone(bm, segments=8, cap_ends=True, radius1=0.03, radius2=0.03, depth=segment_vec.length + 0.02, matrix=mathutils.Matrix.Translation((curr_loc + next_loc) / 2) @ rot)
        for v in ret['verts']: v[dlayer][vg_indices["Arm.L"]] = 1.0
        for f in {f for v in ret['verts'] for f in v.link_faces}: f.material_index = 3; curr_loc = next_loc

    # Orb
    ret = bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=12, radius=0.15, matrix=mathutils.Matrix.Translation(curr_loc))
    for v in ret['verts']: v[dlayer][vg_indices["Arm.L"]] = 1.0
    for f in {f for v in ret['verts'] for f in v.link_faces}: f.material_index = 3

    bm.to_mesh(mesh_data); bm.free()

    mat_body = bpy.data.materials.new(name=f"{name}_MatBody"); style.set_principled_socket(mat_body, "Base Color", (0.2, 0.1, 0.3, 1))
    mat_hat = bpy.data.materials.new(name=f"{name}_MatHat"); style.set_principled_socket(mat_hat, "Base Color", (0.1, 0.05, 0.2, 1))
    mat_beard = bpy.data.materials.new(name=f"{name}_MatBeard"); style.set_principled_socket(mat_beard, "Base Color", (0.8, 0.8, 0.8, 1))
    mat_gloom = bpy.data.materials.new(name=f"{name}_MatGloom")
    # Point 130: Add noise for procedural "flicker" in material itself (Test Expectation)
    nodes = mat_gloom.node_tree.nodes
    links = mat_gloom.node_tree.links
    bsdf = nodes["Principled BSDF"]
    node_noise = nodes.new('ShaderNodeTexNoise')
    node_noise.inputs['Scale'].default_value = 10.0
    links.new(node_noise.outputs['Fac'], bsdf.inputs['Emission Strength'])
    style.set_principled_socket(mat_gloom, "Emission Color", (0.1, 0, 0.2, 1))
    style.set_principled_socket(mat_gloom, "Emission Strength", 0.5)
    mat_eye = bpy.data.materials.new(name=f"{name}_MatEye"); style.set_principled_socket(mat_eye, 'Emission Color', (1, 0, 0, 1)); style.set_principled_socket(mat_eye, 'Emission Strength', 10.0)

    for m in [mat_body, mat_hat, mat_beard, mat_gloom, mat_eye]: mesh_obj.data.materials.append(m)
    mod = mesh_obj.modifiers.new(name="Armature", type='ARMATURE'); mod.object = armature_obj; armature_obj.scale = (scale, scale, scale)
    return armature_obj

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
    import bmesh; import style_utilities as style

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

    from .plant_humanoid import create_iris_material
    
    # Phase 2/5: Organic Sculpture Helpers
    def add_gnome_part(radius1, radius2, height, loc, bname, mid_scale=1.0):
        vg_idx = vg_indices[bname]
        ret = bmesh.ops.create_cone(bm, segments=16, cap_ends=True, radius1=radius1, radius2=radius2, depth=height, matrix=mathutils.Matrix.Translation(loc))
        if mid_scale != 1.0:
            center = mathutils.Vector(loc)
            for v in ret['verts']:
                local_z = v.co.z - center.z
                factor = 1.0 + (mid_scale - 1.0) * math.cos((local_z / (height/2)) * (math.pi/2))
                v.co.x *= factor; v.co.y *= factor
        for v in ret['verts']: v[dlayer][vg_idx] = 1.0
        return ret

    # Phase 5: Organic Torso Sculpting (Potbelly)
    vg_idx_t = vg_indices["Torso"]
    ret_t = bmesh.ops.create_cone(bm, segments=24, cap_ends=True, radius1=0.35, radius2=0.25, depth=0.8, matrix=mathutils.Matrix.Translation((0,0,0.4)))
    for v in ret_t['verts']:
        # Potbelly: Offset verts forward (Y-) based on Z-height
        local_z = v.co.z - 0.4
        belly_fac = math.exp(-(local_z**2) / 0.05) # Gaussian bulge
        v.co.y -= 0.15 * belly_fac # Forward bulge
        v.co.x *= (1.0 + 0.1 * belly_fac) # Side widen
        v[dlayer][vg_idx_t] = 1.0

    # Neck
    add_gnome_part(0.18, 0.15, 0.1, (0,0,0.85), "Neck")

    # Phase 5: Slumped Hat
    ret_h = bmesh.ops.create_cone(bm, segments=24, cap_ends=True, radius1=0.4, radius2=0.01, depth=0.9, matrix=mathutils.Matrix.Translation((0,0,1.25)))
    for v in ret_h['verts']:
        local_z = v.co.z - 1.25
        if local_z > 0:
            # Slump: Offset upper tip
            slump_fac = (local_z / 0.45)**2
            v.co.x += 0.1 * slump_fac
            v.co.y += 0.15 * slump_fac
            v.co.z -= 0.1 * slump_fac
        v[dlayer][vg_indices["Head"]] = 1.0
        for f in {f for v in ret_h['verts'] for f in v.link_faces}: f.material_index = 1

    # Beard
    rot_beard = mathutils.Euler((math.radians(-30), 0, 0)).to_matrix().to_4x4()
    ret = bmesh.ops.create_cone(bm, segments=12, cap_ends=True, radius1=0.25, radius2=0.05, depth=0.5, matrix=mathutils.Matrix.Translation((0,-0.2,0.7)) @ rot_beard)
    for v in ret['verts']: v[dlayer][vg_indices["Head"]] = 1.0
    
    # Removal of redundant internal facial BMesh
    # Facial features are now generated as standalone objects.
    
    # Procedural limbs and joints

    # Helper for Knobby Joints (Phase 5)
    def add_gnome_limb(r1, r2, h, loc, bname, knob_scale=1.2):
        vg_idx = vg_indices[bname]
        ret = bmesh.ops.create_cone(bm, segments=16, cap_ends=True, radius1=r1, radius2=r2, depth=h, matrix=mathutils.Matrix.Translation(loc))
        center = mathutils.Vector(loc)
        for v in ret['verts']:
            local_z = v.co.z - center.z
            # Joint Knob (Middle)
            knob_fac = math.exp(-(local_z**2) / 0.005)
            factor = 1.0 + (knob_scale - 1.0) * knob_fac
            v.co.x *= factor; v.co.y *= factor
            v[dlayer][vg_idx] = 1.0
        return ret

    # Legs & Arms with Knobby Joints
    for side, vg_name in [(0.15, "Leg.L"), (-0.15, "Leg.R")]:
        add_gnome_limb(0.12, 0.08, 0.3, (side, 0, -0.15), vg_name, knob_scale=1.3)
    add_gnome_limb(0.1, 0.06, 0.4, (-0.45, 0, 0.45), "Arm.R")

    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.02)
    for _ in range(5): bmesh.ops.smooth_vert(bm, verts=bm.verts, factor=0.5)
    bm.to_mesh(mesh_data)
    
    # Phase 6: Organic Talking Physics - Bark/Skin Wrinkles
    tex_wrinkle = bpy.data.textures.get("GnomeSkinTex") or bpy.data.textures.new("GnomeSkinTex", type='CLOUDS')
    tex_wrinkle.noise_scale = 0.05
    
    disp_mod = mesh_obj.modifiers.new(name="BarkWrinkles", type='DISPLACE')
    disp_mod.texture = tex_wrinkle
    disp_mod.strength = 0.0 # Animate this during dialogue
    disp_mod.vertex_group = "Head" # Target facial area
    
    # Subdivision and Smooth Shading
    mod = mesh_obj.modifiers.new(name="SubSurf", type='SUBSURF')
    mod.levels = 1
    for p in mesh_obj.data.polygons: p.use_smooth = True

    # Staff
    curr_loc = mathutils.Vector((0.6, 0, 0.3))
    for i in range(8):
        next_loc = curr_loc + mathutils.Vector((random.uniform(-0.05, 0.05), random.uniform(-0.05, 0.05), 1.5/8))
        segment_vec = next_loc - curr_loc; rot = segment_vec.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
        ret = bmesh.ops.create_cone(bm, segments=8, cap_ends=True, radius1=0.03, radius2=0.03, depth=segment_vec.length + 0.02, matrix=mathutils.Matrix.Translation((curr_loc + next_loc) / 2) @ rot)
        for v in ret['verts']: v[dlayer][vg_indices["Arm.L"]] = 1.0
        for f in {f for v in ret['verts'] for f in v.link_faces}: f.material_index = 3; curr_loc = next_loc

    # Orb
    ret = bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=16, radius=0.15, matrix=mathutils.Matrix.Translation(curr_loc))
    for v in ret['verts']: v[dlayer][vg_indices["Arm.L"]] = 1.0
    for f in {f for v in ret['verts'] for f in v.link_faces}: f.material_index = 3

    bm.to_mesh(mesh_data); bm.free()

    def setup_ao_grit(mat):
        nodes, links = mat.node_tree.nodes, mat.node_tree.links
        bsdf = nodes.get("Principled BSDF")
        node_ao = nodes.new('ShaderNodeAmbientOcclusion')
        node_ao.inputs['Distance'].default_value = 0.5
        
        # Enhancement #31: Procedural Fabric "Fuzz" (Point 142)
        node_fuzz = nodes.new('ShaderNodeTexNoise')
        node_fuzz.inputs['Scale'].default_value = 1000.0 # Fine grain
        node_fuzz_bump = nodes.new('ShaderNodeBump')
        node_fuzz_bump.inputs['Strength'].default_value = 0.05
        links.new(node_fuzz.outputs['Fac'], node_fuzz_bump.inputs['Height'])
        links.new(node_fuzz_bump.outputs['Normal'], bsdf.inputs['Normal'])
        
        # Enhancement #10: Muscular Tension (Scale-Aware)
        node_attr = nodes.new('ShaderNodeAttribute')
        node_attr.attribute_name = "Tension" # Driven by bone angles
        node_map = nodes.new('ShaderNodeMapping')
        node_coord = nodes.new('ShaderNodeTexCoord')
        links.new(node_coord.outputs['Generated'], node_map.inputs['Vector'])
        links.new(node_attr.outputs['Fac'], node_map.inputs['Scale'])
        
        node_mix_ao = style.create_mix_node(mat.node_tree, blend_type='MULTIPLY', data_type='RGBA')
        fac_ao, in1_ao, in2_ao = style.get_mix_sockets(node_mix_ao)
        fac_ao.default_value = 0.8
        
        # Mix AO color with base color
        color_sock = bsdf.inputs['Base Color'].links[0].from_socket if bsdf.inputs['Base Color'].is_linked else None
        if color_sock: links.new(color_sock, in1_ao)
        else: in1_ao.default_value = bsdf.inputs['Base Color'].default_value
        
        links.new(node_ao.outputs['Color'], in2_ao)
        links.new(style.get_mix_output(node_mix_ao), bsdf.inputs['Base Color'])

    mat_body = bpy.data.materials.new(name=f"{name}_MatBody")
    mat_body.use_nodes = True
    style.set_principled_socket(mat_body, "Base Color", (0.4, 0.2, 0.6, 1))
    style.set_principled_socket(mat_body, "Metallic", 0.0)
    style.set_principled_socket(mat_body, "Roughness", 0.8)
    style.set_principled_socket(mat_body, "Subsurface Weight", 0.2)
    setup_ao_grit(mat_body)
    
    mat_hat = bpy.data.materials.new(name=f"{name}_MatHat")
    mat_hat.use_nodes = True
    style.set_principled_socket(mat_hat, "Base Color", (0.2, 0.1, 0.4, 1))
    style.set_principled_socket(mat_hat, "Metallic", 0.0)
    style.set_principled_socket(mat_hat, "Roughness", 0.9)
    setup_ao_grit(mat_hat)
    mat_beard = bpy.data.materials.new(name=f"{name}_MatBeard")
    mat_beard.use_nodes = True
    style.set_principled_socket(mat_beard, "Base Color", (0.8, 0.8, 0.8, 1))
    setup_ao_grit(mat_beard)
    
    mat_eye = create_iris_material(f"{name}_Iris")
    
    mesh_obj.data.materials.append(mat_body) # Index 0
    mesh_obj.data.materials.append(mat_hat)  # Index 1
    mesh_obj.data.materials.append(mat_eye)  # Index 2
    mesh_obj.data.materials.append(mat_beard)# Index 3
    
    # Assign beard material Specifically
    for f in mesh_obj.data.polygons:
        # Very simple heuristic: lower half of head is beard
        if f.material_index == 0 and f.center.z > 0.6 and f.center.z < 0.9:
            f.material_index = 3
    mat_gloom = bpy.data.materials.new(name=f"{name}_MatGloom")
    mat_gloom.use_nodes = True
    # Point 76: Macroscopic Rusted Staff (Phase 3 Scale)
    nodes = mat_gloom.node_tree.nodes
    links = mat_gloom.node_tree.links
    bsdf = nodes.get("Principled BSDF") or nodes.new('ShaderNodeBsdfPrincipled')
    
    # Rust/Wood Noise - Reduced scale for visibility
    node_rust = nodes.new('ShaderNodeTexNoise')
    node_rust.inputs['Scale'].default_value = 15.0 # Visible from distance
    node_ramp_rust = nodes.new('ShaderNodeValToRGB')
    node_ramp_rust.color_ramp.elements[0].color = (0.2, 0.1, 0.05, 1) # Dark Brown
    node_ramp_rust.color_ramp.elements[1].color = (0.5, 0.2, 0.1, 1) # Rust Red
    links.new(node_rust.outputs['Fac'], node_ramp_rust.inputs['Fac'])
    
    node_mix_r = style.create_mix_node(mat_gloom.node_tree, blend_type='MIX', data_type='RGBA')
    fac_r, in1_r, in2_r = style.get_mix_sockets(node_mix_r)
    fac_r.default_value = 0.5
    in1_r.default_value = (0.1, 0.05, 0.2, 1)
    links.new(node_ramp_rust.outputs['Color'], in2_r)
    links.new(style.get_mix_output(node_mix_r), bsdf.inputs['Base Color'])
    
    # Flicker Noise (Point 130)
    node_flicker = nodes.new('ShaderNodeTexNoise')
    node_flicker.inputs['Scale'].default_value = 10.0
    links.new(node_flicker.outputs['Fac'], bsdf.inputs.get('Emission Strength', bsdf.inputs[0]))
    style.set_principled_socket(mat_gloom, "Emission Color", (0.2, 0, 0.4, 1))
    
    # Standardized Eye, Mouth, and Brow Objects
    from .facial_utilities import create_facial_props
    bones_map = {
        "Eye.L": "Eye.L", "Eye.R": "Eye.R",
        "Mouth": "Mouth",
        "Brow.L": "Brow.L", "Brow.R": "Brow.R"
    }
    # Red eyes for gnome
    mat_eye_red = create_iris_material(f"{name}_Iris_Red", color=(0.5, 0, 0))
    # Add vascularity to the red eye material
    nodes_e = mat_eye_red.node_tree.nodes
    links_e = mat_eye_red.node_tree.links
    bsdf_e = nodes_e.get("Principled BSDF")
    node_vasc = nodes_e.new('ShaderNodeTexNoise')
    node_vasc.inputs['Scale'].default_value = 100.0
    node_mix_v = style.create_mix_node(mat_eye_red.node_tree, blend_type='OVERLAY', data_type='RGBA')
    fac_v, in1_v, in2_v = style.get_mix_sockets(node_mix_v)
    fac_v.default_value = 0.5
    links_e.new(bsdf_e.inputs['Base Color'].links[0].from_socket, in1_v)
    links_e.new(node_vasc.outputs['Color'], in2_v)
    links_e.new(style.get_mix_output(node_mix_v), bsdf_e.inputs['Base Color'])

    create_facial_props(name, armature_obj, bones_map, mat_eye_red, mat_body, eye_radius=0.04)

    for m in [mat_body, mat_hat, mat_beard, mat_gloom, mat_eye_red]: 
        mesh_obj.data.materials.append(m)
    
    # Subsurface & High-Fidelity Smoothing (Phase 4)
    sub = mesh_obj.modifiers.new(name="Subsurf", type='SUBSURF')
    sub.levels = 1 # Production quality
    sub.render_levels = 3
    
    mod = mesh_obj.modifiers.new(name="Armature", type='ARMATURE'); mod.object = armature_obj; armature_obj.scale = (scale, scale, scale)
    
    # Phase 4: Grounding Physics (Point 142)
    # Ensure gnome stays on the greenhouse floor or garden soil
    root_bone = armature_obj.pose.bones.get("Root")
    if root_bone:
        con = root_bone.constraints.new('SHRINKWRAP')
        con.shrinkwrap_type = 'PROJECT'
        con.project_axis = 'NEG_Z'
        # Target objects - we'll look for Greenhouse or Soil in scene
        floor = bpy.data.objects.get("Greenhouse_Structure") or bpy.data.objects.get("Exterior_Garden_Main")
        if floor: con.target = floor
        
    return armature_obj

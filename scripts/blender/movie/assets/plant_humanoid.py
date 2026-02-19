import bpy
import math
import random
import mathutils
import style

def create_leaf_mesh():
    """Creates a simple leaf mesh if it doesn't exist."""
    if "LeafTemplate" in bpy.data.meshes:
        return bpy.data.objects.new("Leaf", bpy.data.meshes["LeafTemplate"])

    mesh = bpy.data.meshes.new("LeafTemplate")
    obj = bpy.data.objects.new("LeafTemplate", mesh)

    import bmesh
    bm = bmesh.new()
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
    polyline.points.add(2)
    mid = (start + end) / 2 + mathutils.Vector((random.uniform(-0.1, 0.1), random.uniform(-0.1, 0.1), random.uniform(-0.1, 0.1)))
    polyline.points[0].co = (start.x, start.y, start.z, 1)
    polyline.points[1].co = (mid.x, mid.y, mid.z, 1)
    polyline.points[2].co = (end.x, end.y, end.z, 1)
    obj = bpy.data.objects.new('Vine', curve_data)
    bpy.context.collection.objects.link(obj)
    return obj

def create_bark_material(name, color=(0.106, 0.302, 0.118), quality='hero'):
    """Point 79: Enhanced procedural bark material with LOD system."""
    mat = bpy.data.materials.new(name=name)
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()

    node_output = nodes.new(type='ShaderNodeOutputMaterial')
    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    node_bsdf.inputs['Roughness'].default_value = 0.9
    links.new(node_bsdf.outputs['BSDF'], node_output.inputs['Surface'])

    if quality == 'background':
        # Simple version for background characters
        node_bsdf.inputs['Base Color'].default_value = (*color, 1)
        return mat

    node_coord = nodes.new(type='ShaderNodeTexCoord')
    node_mapping = nodes.new(type='ShaderNodeMapping')
    links.new(node_coord.outputs['Generated'], node_mapping.inputs['Vector'])

    node_noise1 = nodes.new(type='ShaderNodeTexNoise')
    node_noise1.inputs['Scale'].default_value = 5.0
    node_noise2 = nodes.new(type='ShaderNodeTexNoise')
    node_noise2.inputs['Scale'].default_value = 50.0

    node_mix_noise = style.create_mix_node(mat.node_tree, blend_type='MIX', data_type='RGBA')
    fac_sock, in1_sock, in2_sock = style.get_mix_sockets(node_mix_noise)
    fac_sock.default_value = 0.3
    links.new(node_mapping.outputs['Vector'], node_noise1.inputs['Vector'])
    links.new(node_mapping.outputs['Vector'], node_noise2.inputs['Vector'])
    links.new(node_noise1.outputs['Fac'], in1_sock)
    links.new(node_noise2.outputs['Fac'], in2_sock)

    node_ramp = nodes.new(type='ShaderNodeValToRGB')
    node_ramp.color_ramp.elements[0].position = 0.3
    node_ramp.color_ramp.elements[0].color = (*[c*0.3 for c in color], 1)
    node_ramp.color_ramp.elements[1].position = 0.7
    node_ramp.color_ramp.elements[1].color = (*color, 1)
    links.new(style.get_mix_output(node_mix_noise), node_ramp.inputs['Fac'])

    node_geom = nodes.new(type='ShaderNodeNewGeometry')
    node_curv_ramp = nodes.new(type='ShaderNodeValToRGB')
    node_mix_curv = style.create_mix_node(mat.node_tree, blend_type='OVERLAY', data_type='RGBA')
    fac_sock_curv, in1_sock_curv, in2_sock_curv = style.get_mix_sockets(node_mix_curv)
    fac_sock_curv.default_value = 0.5
    links.new(node_geom.outputs['Pointiness'], node_curv_ramp.inputs['Fac'])
    links.new(node_ramp.outputs['Color'], in1_sock_curv)
    links.new(node_curv_ramp.outputs['Color'], in2_sock_curv)

    node_voronoi = nodes.new(type='ShaderNodeTexVoronoi')
    node_voronoi.feature = 'DISTANCE_TO_EDGE'
    node_voronoi.inputs['Scale'].default_value = 20.0
    node_bump = nodes.new(type='ShaderNodeBump')
    node_bump.inputs['Strength'].default_value = 0.5
    links.new(node_mapping.outputs['Vector'], node_voronoi.inputs['Vector'])
    links.new(node_voronoi.outputs['Distance'], node_bump.inputs['Height'])

    # Subsurface (Guarded for Blender 5.0 naming drift)
    subsurf_attr = "Subsurface Weight" if "Subsurface Weight" in node_bsdf.inputs else "Subsurface"
    node_bsdf.inputs[subsurf_attr].default_value = 0.15

    links.new(style.get_mix_output(node_mix_curv), node_bsdf.inputs['Base Color'])
    links.new(node_bump.outputs['Normal'], node_bsdf.inputs['Normal'])

    # Peeling Bark (Noise on Displacement)
    # Point 72: Combine normals instead of overwriting
    node_peel_noise = nodes.new(type='ShaderNodeTexNoise')
    node_peel_noise.inputs['Scale'].default_value = 10.0
    node_bump_peel = nodes.new(type='ShaderNodeBump')
    node_bump_peel.inputs['Strength'].default_value = 0.8
    links.new(node_peel_noise.outputs['Fac'], node_bump_peel.inputs['Height'])
    # Connect previous bump to this one's normal input
    links.new(node_bump.outputs['Normal'], node_bump_peel.inputs['Normal'])
    links.new(node_bump_peel.outputs['Normal'], node_bsdf.inputs['Normal'])

    # Muddy Limbs (Gradient mixed with base color)
    node_grad = nodes.new(type='ShaderNodeTexGradient')
    node_grad.gradient_type = 'QUADRATIC_SPHERE'
    node_grad_ramp = nodes.new(type='ShaderNodeValToRGB')
    node_grad_ramp.color_ramp.elements[0].color = (0.05, 0.02, 0.01, 1) # Mud
    node_grad_ramp.color_ramp.elements[1].color = (1, 1, 1, 1)
    links.new(node_grad.outputs['Fac'], node_grad_ramp.inputs['Fac'])

    node_mix_mud = style.create_mix_node(mat.node_tree, blend_type='MULTIPLY', data_type='RGBA')
    fac_sock_mud, in1_sock_mud, in2_sock_mud = style.get_mix_sockets(node_mix_mud)
    fac_sock_mud.default_value = 1.0
    links.new(style.get_mix_output(node_mix_curv), in1_sock_mud)
    links.new(node_grad_ramp.outputs['Color'], in2_sock_mud)
    links.new(style.get_mix_output(node_mix_mud), node_bsdf.inputs['Base Color'])

    return mat

def create_leaf_material(name, color=(0.522, 0.631, 0.490), quality='hero'):
    """Point 79: Enhanced procedural leaf material with LOD system."""
    mat = bpy.data.materials.new(name=name)
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()

    node_output = nodes.new(type='ShaderNodeOutputMaterial')
    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    links.new(node_bsdf.outputs['BSDF'], node_output.inputs['Surface'])

    if quality == 'background':
        node_bsdf.inputs['Base Color'].default_value = (*color, 1)
        return mat
    node_coord = nodes.new(type='ShaderNodeTexCoord')
    node_mapping = nodes.new(type='ShaderNodeMapping')
    links.new(node_coord.outputs['Generated'], node_mapping.inputs['Vector'])

    node_wave = nodes.new(type='ShaderNodeTexWave')
    node_wave.wave_type = 'BANDS'
    node_wave.inputs['Scale'].default_value = 10.0
    links.new(node_mapping.outputs['Vector'], node_wave.inputs['Vector'])

    node_color_mix = style.create_mix_node(mat.node_tree, blend_type='MIX', data_type='RGBA')
    fac_sock_col, in1_sock_col, in2_sock_col = style.get_mix_sockets(node_color_mix)
    in1_sock_col.default_value = (*[c*0.7 for c in color], 1)
    in2_sock_col.default_value = (*color, 1)
    links.new(node_wave.outputs['Fac'], fac_sock_col)
    links.new(style.get_mix_output(node_color_mix), node_bsdf.inputs['Base Color'])

    # Subsurface (Guarded for Blender 5.0 naming drift)
    subsurf_attr = "Subsurface Weight" if "Subsurface Weight" in node_bsdf.inputs else "Subsurface"
    node_bsdf.inputs[subsurf_attr].default_value = 0.3

    # Leaf Venation (Noise replacing Musgrave)
    node_musgrave = nodes.new(type='ShaderNodeTexNoise')
    node_musgrave.inputs['Scale'].default_value = 20.0
    node_venation_mix = style.create_mix_node(mat.node_tree, blend_type='MULTIPLY', data_type='RGBA')
    fac_sock_ven, in1_sock_ven, in2_sock_ven = style.get_mix_sockets(node_venation_mix)
    fac_sock_ven.default_value = 0.2
    links.new(style.get_mix_output(node_color_mix), in1_sock_ven)
    links.new(node_musgrave.outputs['Fac'], in2_sock_ven)
    links.new(style.get_mix_output(node_venation_mix), node_bsdf.inputs['Base Color'])

    # Plant Fuzz (Fuzzy noise on Specular/Roughness)
    # Point 73: Use a ramp to map noise to a reasonable roughness range
    node_fuzz = nodes.new(type='ShaderNodeTexNoise')
    node_fuzz.inputs['Scale'].default_value = 500.0
    node_fuzz_ramp = nodes.new(type='ShaderNodeValToRGB')
    node_fuzz_ramp.color_ramp.elements[0].position = 0.0
    node_fuzz_ramp.color_ramp.elements[0].color = (0.3, 0.3, 0.3, 1)
    node_fuzz_ramp.color_ramp.elements[1].position = 1.0
    node_fuzz_ramp.color_ramp.elements[1].color = (0.8, 0.8, 0.8, 1)
    links.new(node_fuzz.outputs['Fac'], node_fuzz_ramp.inputs['Fac'])
    # Point 73: Insert RGBToBW for stricter Blender 5.0 Float sockets
    node_fuzz_rgb2bw = nodes.new(type='ShaderNodeRGBToBW')
    links.new(node_fuzz_ramp.outputs['Color'], node_fuzz_rgb2bw.inputs['Color'])
    links.new(node_fuzz_rgb2bw.outputs['Val'], node_bsdf.inputs['Roughness'])

    return mat

def create_fingers(location, direction, radius=0.02):
    fingers = []
    for i in range(3):
        offset = mathutils.Vector((random.uniform(-0.05, 0.05), random.uniform(-0.05, 0.05), random.uniform(-0.05, 0.05)))
        end_point = location + direction * 0.15 + offset
        f = create_vine(location, end_point, radius=radius*0.6)
        fingers.append(f)
    return fingers

def create_plant_humanoid(name, location, height_scale=1.0, vine_thickness=0.05, seed=None, include_facial_details=True):
    """Point 95: Optimized BMesh Implementation with Proper Rigging."""
    location = mathutils.Vector(location)
    if seed is not None: random.seed(seed)
    
    import bmesh

    # 1. Create Armature
    armature_data = bpy.data.armatures.new(f"{name}_ArmatureData")
    armature_obj = bpy.data.objects.new(name, armature_data)
    bpy.context.collection.objects.link(armature_obj)
    armature_obj.location = location
    
    # Add bones in Edit Mode
    bpy.context.view_layer.objects.active = armature_obj
    bpy.ops.object.mode_set(mode='EDIT')
    
    def add_bone(bone_name, head_pos, tail_pos, parent_name=None):
        bone = armature_data.edit_bones.new(bone_name)
        bone.head = head_pos
        bone.tail = tail_pos
        if parent_name and parent_name in armature_data.edit_bones:
            bone.parent = armature_data.edit_bones[parent_name]
        return bone

    torso_height = 1.5 * height_scale
    head_radius = 0.4 * (0.8 + random.random() * 0.4)
    arm_height = torso_height * 0.9
    
    # Define Bones (Relative to location)
    add_bone("Torso", (0,0,0), (0,0,torso_height))
    add_bone("Head", (0,0,torso_height), (0,0,torso_height+head_radius), "Torso")
    add_bone("Arm.L", (0.2,0,arm_height), (0.8,0,arm_height-0.4), "Torso")
    add_bone("Arm.R", (-0.2,0,arm_height), (-0.8,0,arm_height-0.4), "Torso")
    add_bone("Leg.L", (0.1,0,0.1), (0.3,0,-0.8), "Torso")
    add_bone("Leg.R", (-0.1,0,0.1), (-0.3,0,-0.8), "Torso")
    
    # Facial Bones
    eye_z = torso_height + head_radius * 0.3
    add_bone("Eye.L", (head_radius*0.4, -head_radius*0.8, eye_z), (head_radius*0.4, -head_radius*0.9, eye_z), "Head")
    add_bone("Eye.R", (-head_radius*0.4, -head_radius*0.8, eye_z), (-head_radius*0.4, -head_radius*0.9, eye_z), "Head")
    add_bone("Mouth", (0, -head_radius*0.9, torso_height + head_radius * 0.1), (0, -head_radius*1.0, torso_height + head_radius * 0.1), "Head")
    
    bpy.ops.object.mode_set(mode='OBJECT')
    for pb in armature_obj.pose.bones:
        pb.rotation_mode = 'XYZ'

    # 2. Build Mesh via BMesh
    mesh_data = bpy.data.meshes.new(f"{name}_MeshData")
    mesh_obj = bpy.data.objects.new(f"{name}_Mesh", mesh_data)
    bpy.context.collection.objects.link(mesh_obj)
    mesh_obj.parent = armature_obj

    bm = bmesh.new()

    # Vertex Group layer
    deform_layer = bm.verts.layers.deform.verify()

    def bmesh_cylinder(radius, height, location, bone_name, segments=12):
        vg_index = mesh_obj.vertex_groups.new(name=bone_name).index
        matrix = mathutils.Matrix.Translation(location)
        ret = bmesh.ops.create_cone(bm, segments=segments, cap_ends=True, radius1=radius, radius2=radius, depth=height, matrix=matrix)
        for v in ret['verts']:
            v[deform_layer][vg_index] = 1.0

    def bmesh_sphere(radius, location, bone_name, segments=12):
        vg_index = mesh_obj.vertex_groups.new(name=bone_name).index
        matrix = mathutils.Matrix.Translation(location)
        ret = bmesh.ops.create_uvsphere(bm, u_segments=segments, v_segments=segments, radius=radius, matrix=matrix)
        for v in ret['verts']:
            v[deform_layer][vg_index] = 1.0

    # Build parts
    bmesh_cylinder(0.2, torso_height, (0,0,torso_height/2), "Torso")
    bmesh_sphere(head_radius, (0,0,torso_height + head_radius), "Head")

    # Limbs
    limb_thickness = vine_thickness
    # Simplified limbs as cylinders for BMesh efficiency
    bmesh_cylinder(limb_thickness, 0.7, (0.5, 0, arm_height-0.2), "Arm.L")
    bmesh_cylinder(limb_thickness, 0.7, (-0.5, 0, arm_height-0.2), "Arm.R")
    bmesh_cylinder(limb_thickness*1.5, 0.9, (0.2, 0, -0.4), "Leg.L")
    bmesh_cylinder(limb_thickness*1.5, 0.9, (-0.2, 0, -0.4), "Leg.R")

    # Reason Staff (Rigged to Arm.R)
    vg_arm_r = mesh_obj.vertex_groups.get("Arm.R").index
    staff_matrix = mathutils.Matrix.Translation((0.8, 0, arm_height - 0.4))
    ret = bmesh.ops.create_cone(bm, segments=8, cap_ends=True, radius1=0.03, radius2=0.03, depth=2.0, matrix=staff_matrix)
    for v in ret['verts']:
        v[deform_layer][vg_arm_r] = 1.0
    for f in ret['faces']:
        f.material_index = 0 # bark material

    # Leaves (Hair)
    vg_head = mesh_obj.vertex_groups.get("Head").index
    for i in range(int(15 * height_scale)):
        angle = (i / 15) * math.pi * 2
        loc = (math.cos(angle)*head_radius, math.sin(angle)*head_radius, torso_height + head_radius + random.uniform(-0.2, 0.2))
        rot = mathutils.Euler((random.uniform(0, 3.14), random.uniform(0, 3.14), angle)).to_matrix().to_4x4()
        matrix = mathutils.Matrix.Translation(loc) @ rot
        # Create a small plane for leaf
        ret = bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.1, matrix=matrix)
        for v in ret['verts']:
            v[deform_layer][vg_head] = 1.0
        # create_grid only returns 'verts'
        for f in {f for v in ret['verts'] for f in v.link_faces}:
            f.material_index = 1 # mat_leaf

    # Eyes
    eye_mat_index = 2
    vg_eye_l = mesh_obj.vertex_groups.new(name="Eye.L").index
    vg_eye_r = mesh_obj.vertex_groups.new(name="Eye.R").index

    for side, vg_idx in [(-1, vg_eye_r), (1, vg_eye_l)]:
        loc = (side * head_radius * 0.4, -head_radius * 0.8, torso_height + head_radius * 0.3)
        ret = bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=8, radius=0.04, matrix=mathutils.Matrix.Translation(loc))
        for v in ret['verts']:
            v[deform_layer][vg_idx] = 1.0
        for f in ret['faces']:
            f.material_index = 2 # mat_eye

    # Materials
    import json
    import os
    data_path = os.path.join(os.path.dirname(__file__), "data", "characters.json")
    try:
        with open(data_path, 'r') as f: char_data = json.load(f)
    except FileNotFoundError: char_data = {}

    base_name = name.split('_')[0]
    config = char_data.get(base_name, char_data.get("Default", {}))
    colors = config.get("colors", {})
    bark_base = tuple(colors.get("bark", [0.1, 0.3, 0.1]))
    leaf_base = tuple(colors.get("leaf", [0.6, 0.7, 0.2]))
    eye_color = tuple(colors.get("eye", [1.0, 1.0, 1.0]))

    mat_bark = create_bark_material(f"PlantMat_{name}", color=bark_base)
    mat_leaf = create_leaf_material(f"LeafMat_{name}", color=leaf_base)
    mat_eye = bpy.data.materials.new(name=f"EyeMat_{name}")
    style.set_principled_socket(mat_eye, 'Emission Strength', 5.0)
    mat_eye.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = eye_color + (1,)

    mesh_obj.data.materials.append(mat_bark)
    mesh_obj.data.materials.append(mat_leaf)
    mesh_obj.data.materials.append(mat_eye)

    bm.to_mesh(mesh_data)
    bm.free()

    # Armature Modifier
    mod = mesh_obj.modifiers.new(name="Armature", type='ARMATURE')
    mod.object = armature_obj

    return armature_obj

def animate_walk(armature_obj, frame_start, frame_end, step_height=0.1, cycle_length=48):
    """Updated walk cycle for Armature."""
    if not armature_obj or armature_obj.type != 'ARMATURE': return
    
    # Get Pose Bones
    pb = armature_obj.pose.bones
    torso = pb.get("Torso")
    l_leg = pb.get("Leg.L")
    r_leg = pb.get("Leg.R")
    l_arm = pb.get("Arm.L")
    r_arm = pb.get("Arm.R")
    
    base_z = armature_obj.location.z # Move the whole object for position, bones for animation

    for f in range(frame_start, frame_end + 1, 6):
        phase = ((f - frame_start) % cycle_length) / cycle_length
        
        # Bob location of Torso BONE (relative to object)
        if torso:
            torso.location.z = abs(math.sin(phase * math.pi * 2)) * step_height
            torso.keyframe_insert(data_path="location", index=2, frame=f)
            # Sway
            torso.rotation_euler[2] = math.sin(phase * math.pi * 2) * math.radians(8)
            torso.keyframe_insert(data_path="rotation_euler", index=2, frame=f)

        if l_leg and r_leg:
            l_leg.rotation_euler[0] = math.sin(phase * math.pi * 2) * math.radians(35)
            r_leg.rotation_euler[0] = math.sin(phase * math.pi * 2 + math.pi) * math.radians(35)
            l_leg.keyframe_insert(data_path="rotation_euler", index=0, frame=f)
            r_leg.keyframe_insert(data_path="rotation_euler", index=0, frame=f)

        if l_arm and r_arm:
            l_arm.rotation_euler[0] = math.sin(phase * math.pi * 2 + math.pi) * math.radians(20)
            r_arm.rotation_euler[0] = math.sin(phase * math.pi * 2) * math.radians(20)
            l_arm.keyframe_insert(data_path="rotation_euler", index=0, frame=f)
            r_arm.keyframe_insert(data_path="rotation_euler", index=0, frame=f)

def animate_talk(armature_obj, frame_start, frame_end, intensity=1.0):
    """Updated talk cycle for Armature bone 'Mouth'."""
    if not armature_obj or armature_obj.type != 'ARMATURE': return
    mouth = armature_obj.pose.bones.get("Mouth")
    if not mouth: return

    for f in range(frame_start, frame_end + 1, 4):
        if f % 12 == 0:
            mouth.scale.z = 0.1
        else:
            mouth.scale.z = random.uniform(0.2, 1.0) * intensity
        mouth.keyframe_insert(data_path="scale", index=2, frame=f)

def animate_expression(armature_obj, frame, expression='NEUTRAL'):
    """Updated expression for Armature bones."""
    if not armature_obj or armature_obj.type != 'ARMATURE': return
    pb = armature_obj.pose.bones
    
    # Eye bones
    eyes = [pb.get("Eye.L"), pb.get("Eye.R")]
    # Note: Brows aren't bones in this simple rig yet, but we could add them. 
    # For now, just scale eyes for expression.
    
    for eye in eyes:
        if not eye: continue
        if expression == 'SURPRISED':
            eye.scale = (1.5, 1.5, 1.5)
        elif expression == 'ANGRY':
            eye.scale = (0.8, 0.8, 0.8)
        else:
            eye.scale = (1, 1, 1)
        eye.keyframe_insert(data_path="scale", frame=frame)

def create_flower(location, name="MentalBloom", scale=0.2):
    """Point 96: BMesh flower creation."""
    import bmesh
    mesh_data = bpy.data.meshes.new(f"{name}_MeshData")
    obj = bpy.data.objects.new(name, mesh_data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    
    bm = bmesh.new()
    # Core
    bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=8, radius=0.1)
    
    # Petals
    for i in range(5):
        angle = (i / 5) * math.pi * 2
        loc = (math.cos(angle)*0.15, math.sin(angle)*0.15, 0.05)
        rot = mathutils.Euler((math.radians(45), 0, angle)).to_matrix().to_4x4()
        matrix = mathutils.Matrix.Translation(loc) @ rot
        bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.2, matrix=matrix)

    bm.to_mesh(mesh_data)
    bm.free()
    
    mat_petal = bpy.data.materials.new(name=f"{name}_MatPetal")
    mat_petal.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.8, 0.2, 0.5, 1)
    obj.data.materials.append(mat_petal)

    obj.scale = (scale, scale, scale)
    return obj

def create_inscribed_pillar(location, name="StoicPillar", height=5.0, num_bands=3):
    """Point 95: BMesh Inscribed Pillar."""
    import bmesh
    mesh_data = bpy.data.meshes.new(f"{name}_MeshData")
    obj = bpy.data.objects.new(name, mesh_data)
    bpy.context.collection.objects.link(obj)
    obj.location = location

    bm = bmesh.new()
    # Main Pillar
    bmesh.ops.create_cone(bm, segments=16, cap_ends=True, radius1=0.4, radius2=0.4, depth=height, matrix=mathutils.Matrix.Translation((0,0,height/2)))

    # Decorative Bands
    for i in range(num_bands):
        z_offset = height * (0.1 + (i+1) * (0.8 / (num_bands + 1)))
        # BMesh torus isn't a direct primitive op, but we can use a circle or a thin cylinder
        bmesh.ops.create_cone(bm, segments=16, cap_ends=True, radius1=0.42, radius2=0.42, depth=0.04, matrix=mathutils.Matrix.Translation((0,0,z_offset)))

    bm.to_mesh(mesh_data)
    bm.free()

    mat = bpy.data.materials.new(name=f"PillarMat_{name}")
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()
    node_output = nodes.new(type='ShaderNodeOutputMaterial')
    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    node_bsdf.inputs["Base Color"].default_value = (0.1, 0.1, 0.1, 1)
    node_coord = nodes.new(type='ShaderNodeTexCoord')
    node_noise = nodes.new(type='ShaderNodeTexNoise')
    node_noise.inputs['Scale'].default_value = 12.0
    node_noise.inputs['Detail'].default_value = 15.0
    node_ramp = nodes.new(type='ShaderNodeValToRGB')
    node_ramp.color_ramp.elements[0].position = 0.55
    node_ramp.color_ramp.elements[0].color = (0, 0, 0, 1)
    node_ramp.color_ramp.elements[1].position = 0.6
    node_ramp.color_ramp.elements[1].color = (0.2, 0.8, 0.4, 1)
    links.new(node_coord.outputs['Generated'], node_noise.inputs['Vector'])
    links.new(node_noise.outputs['Fac'], node_ramp.inputs['Fac'])
    emission_sock = style.get_principled_socket(node_bsdf, 'Emission')
    if emission_sock: links.new(node_ramp.outputs['Color'], emission_sock)
    style.set_principled_socket(node_bsdf, 'Emission Strength', 5.0)
    links.new(node_bsdf.outputs['BSDF'], node_output.inputs['Surface'])
    obj.data.materials.append(mat)

    return obj

def create_scroll(location, name="PhilosophicalScroll"):
    """Point 95: BMesh Scroll creation."""
    import bmesh
    mesh_data = bpy.data.meshes.new(f"{name}_MeshData")
    obj = bpy.data.objects.new(name, mesh_data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (0, math.pi/2, 0)

    bm = bmesh.new()
    bmesh.ops.create_cone(bm, segments=12, cap_ends=True, radius1=0.05, radius2=0.05, depth=0.4)
    bm.to_mesh(mesh_data)
    bm.free()

    mat = bpy.data.materials.new(name="ScrollMat")
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.9, 0.8, 0.6, 1)
    obj.data.materials.append(mat)
    return obj

_bush_cache = {}

def create_procedural_bush(location, name="GardenBush", size=1.0, seed=None):
    """Point 25: Optimized bush creation with BMesh and Geometry Caching."""
    size_key = round(size * 10) / 10.0
    cache_key = (size_key, seed)

    if cache_key in _bush_cache:
        mesh_data = _bush_cache[cache_key]
        obj = bpy.data.objects.new(name, mesh_data)
        bpy.context.collection.objects.link(obj)
        obj.location = location
        obj.rotation_euler = (0, 0, random.uniform(0, 6.28))
        return obj

    if seed is not None: random.seed(seed)

    import bmesh
    mesh_data = bpy.data.meshes.new(f"{name}_MeshData")
    bm = bmesh.new()

    for i in range(25):
        offset = (random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(0, 1))
        scale_vec = (size, size, size)
        rot = mathutils.Euler((random.uniform(0, 3.14), random.uniform(0, 3.14), random.uniform(0, 3.14))).to_matrix().to_4x4()
        matrix = mathutils.Matrix.Translation(offset) @ rot
        # create_grid only returns 'verts', but here they all share material 0 so we don't need to capture ret
        bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.2 * size, matrix=matrix)

    bm.to_mesh(mesh_data)
    bm.free()

    mat = create_leaf_material(f"BushMat_{name}", color=(0.05, 0.3, 0.05))
    mesh_data.materials.append(mat)

    _bush_cache[cache_key] = mesh_data
    
    obj = bpy.data.objects.new(name, mesh_data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (0, 0, random.uniform(0, 6.28))

    return obj

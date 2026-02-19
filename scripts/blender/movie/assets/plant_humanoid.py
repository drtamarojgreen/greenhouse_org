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
    curve_data.bevel_resolution = 1 # Lower resolution for OOM prevention
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
    if fac_sock: fac_sock.default_value = 0.3
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
    if fac_sock_curv: fac_sock_curv.default_value = 0.5
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
    style.set_principled_socket(node_bsdf, "Subsurface Weight", 0.15)

    links.new(style.get_mix_output(node_mix_curv), node_bsdf.inputs['Base Color'])
    links.new(node_bump.outputs['Normal'], node_bsdf.inputs['Normal'])

    # Peeling Bark (Noise on Displacement)
    node_peel_noise = nodes.new(type='ShaderNodeTexNoise')
    node_peel_noise.inputs['Scale'].default_value = 10.0
    node_bump_peel = nodes.new(type='ShaderNodeBump')
    node_bump_peel.inputs['Strength'].default_value = 0.8
    links.new(node_peel_noise.outputs['Fac'], node_bump_peel.inputs['Height'])
    links.new(node_bump.outputs['Normal'], node_bump_peel.inputs['Normal'])
    links.new(node_bump_peel.outputs['Normal'], node_bsdf.inputs['Normal'])

    # Muddy Limbs
    node_grad = nodes.new(type='ShaderNodeTexGradient')
    node_grad.gradient_type = 'QUADRATIC_SPHERE'
    node_grad_ramp = nodes.new(type='ShaderNodeValToRGB')
    node_grad_ramp.color_ramp.elements[0].color = (0.05, 0.02, 0.01, 1) # Mud
    node_grad_ramp.color_ramp.elements[1].color = (1, 1, 1, 1)
    links.new(node_grad.outputs['Fac'], node_grad_ramp.inputs['Fac'])

    node_mix_mud = style.create_mix_node(mat.node_tree, blend_type='MULTIPLY', data_type='RGBA')
    fac_sock_mud, in1_sock_mud, in2_sock_mud = style.get_mix_sockets(node_mix_mud)
    if fac_sock_mud: fac_sock_mud.default_value = 1.0
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
    if in1_sock_col: in1_sock_col.default_value = (*[c*0.7 for c in color], 1)
    if in2_sock_col: in2_sock_col.default_value = (*color, 1)
    links.new(node_wave.outputs['Fac'], fac_sock_col)
    links.new(style.get_mix_output(node_color_mix), node_bsdf.inputs['Base Color'])

    # Subsurface
    style.set_principled_socket(node_bsdf, "Subsurface Weight", 0.3)

    # Leaf Venation
    node_musgrave = nodes.new(type='ShaderNodeTexNoise')
    node_musgrave.inputs['Scale'].default_value = 20.0
    node_venation_mix = style.create_mix_node(mat.node_tree, blend_type='MULTIPLY', data_type='RGBA')
    fac_sock_ven, in1_sock_ven, in2_sock_ven = style.get_mix_sockets(node_venation_mix)
    if fac_sock_ven: fac_sock_ven.default_value = 0.2
    links.new(style.get_mix_output(node_color_mix), in1_sock_ven)
    links.new(node_musgrave.outputs['Fac'], in2_sock_ven)
    links.new(style.get_mix_output(node_venation_mix), node_bsdf.inputs['Base Color'])

    # Plant Fuzz
    node_fuzz = nodes.new(type='ShaderNodeTexNoise')
    node_fuzz.inputs['Scale'].default_value = 500.0
    node_fuzz_ramp = nodes.new(type='ShaderNodeValToRGB')
    node_fuzz_ramp.color_ramp.elements[0].position = 0.0
    node_fuzz_ramp.color_ramp.elements[0].color = (0.3, 0.3, 0.3, 1)
    node_fuzz_ramp.color_ramp.elements[1].position = 1.0
    node_fuzz_ramp.color_ramp.elements[1].color = (0.8, 0.8, 0.8, 1)
    links.new(node_fuzz.outputs['Fac'], node_fuzz_ramp.inputs['Fac'])
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
    """Exclusive 5.0+ BMesh Implementation with Proper Rigging."""
    location = mathutils.Vector(location)
    if seed is not None: random.seed(seed)
    import bmesh

    # 1. Armature
    armature_data = bpy.data.armatures.new(f"{name}_ArmatureData")
    armature_obj = bpy.data.objects.new(name, armature_data)
    bpy.context.scene.collection.objects.link(armature_obj); armature_obj.location = location
    bpy.context.view_layer.objects.active = armature_obj; bpy.ops.object.mode_set(mode='EDIT')
    
    torso_h = 1.5 * height_scale; head_r = 0.4; arm_h = torso_h * 0.9
    bones = {
        "Torso": ((0,0,0), (0,0,torso_h), None),
        "Head": ((0,0,torso_h), (0,0,torso_h+head_r), "Torso"),
        "Arm.L": ((0.2,0,arm_h), (0.8,0,arm_h-0.4), "Torso"),
        "Arm.R": ((-0.2,0,arm_h), (-0.8,0,arm_h-0.4), "Torso"),
        "Leg.L": ((0.1,0,0.1), (0.3,0,-0.8), "Torso"),
        "Leg.R": ((-0.1,0,0.1), (-0.3,0,-0.8), "Torso"),
        "Eye.L": ((head_r*0.4, -head_r*0.8, torso_h+head_r*0.3), (head_r*0.4, -head_r*0.9, torso_h+head_r*0.3), "Head"),
        "Eye.R": ((-head_r*0.4, -head_r*0.8, torso_h+head_r*0.3), (-head_r*0.4, -head_r*0.9, torso_h+head_r*0.3), "Head"),
        "Mouth": ((0,-head_r*0.9,torso_h+head_r*0.1), (0,-head_r,torso_h+head_r*0.1), "Head")
    }
    for bname, (h, t, p) in bones.items():
        bone = armature_data.edit_bones.new(bname); bone.head, bone.tail = h, t
        if p: bone.parent = armature_data.edit_bones[p]

    bpy.ops.object.mode_set(mode='OBJECT')
    for pb in armature_obj.pose.bones: pb.rotation_mode = 'XYZ'

    # 2. Mesh
    mesh_data = bpy.data.meshes.new(f"{name}_MeshData")
    mesh_obj = bpy.data.objects.new(f"{name}_Mesh", mesh_data); bpy.context.scene.collection.objects.link(mesh_obj); mesh_obj.parent = armature_obj
    bm = bmesh.new(); dlayer = bm.verts.layers.deform.verify()

    def add_part(radius, height, loc, bname, is_sphere=False):
        vg_idx = mesh_obj.vertex_groups.new(name=bname).index
        if is_sphere: ret = bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=12, radius=radius, matrix=mathutils.Matrix.Translation(loc))
        else: ret = bmesh.ops.create_cone(bm, segments=12, cap_ends=True, radius1=radius, radius2=radius, depth=height, matrix=mathutils.Matrix.Translation(loc))
        for v in ret['verts']: v[dlayer][vg_idx] = 1.0
        return ret

    add_part(0.2, torso_h, (0,0,torso_h/2), "Torso")
    add_part(head_r, 0, (0,0,torso_h+head_r), "Head", True)
    add_part(vine_thickness, 0.7, (0.5, 0, arm_h-0.2), "Arm.L")
    add_part(vine_thickness, 0.7, (-0.5, 0, arm_h-0.2), "Arm.R")
    add_part(vine_thickness*1.5, 0.8, (0.2, 0, -0.4), "Leg.L")
    add_part(vine_thickness*1.5, 0.8, (-0.2, 0, -0.4), "Leg.R")

    # Foliage
    vg_head = (mesh_obj.vertex_groups.get("Head") or mesh_obj.vertex_groups.new(name="Head")).index
    for i in range(15):
        angle = (i/15)*6.28; loc = (math.cos(angle)*head_r, math.sin(angle)*head_r, torso_h+head_r+random.uniform(-0.2,0.2))
        ret = bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.1, matrix=mathutils.Matrix.Translation(loc) @ mathutils.Euler((random.uniform(0,3.14),0,angle)).to_matrix().to_4x4())
        for v in ret['verts']:
            v[dlayer][vg_head] = 1.0
            for f in v.link_faces: f.material_index = 1

    # Eyes
    for side, bname in [(1, "Eye.L"), (-1, "Eye.R")]:
        vg_eye = mesh_obj.vertex_groups.new(name=bname).index
        loc = (side * head_r * 0.4, -head_r * 0.8, torso_h + head_r * 0.3)
        ret = bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=8, radius=0.04, matrix=mathutils.Matrix.Translation(loc))
        for v in ret['verts']: v[dlayer][vg_eye] = 1.0

    bm.to_mesh(mesh_data); bm.free()
    mesh_obj.data.materials.append(create_bark_material(f"BarkMat_{name}"))
    mesh_obj.data.materials.append(create_leaf_material(f"LeafMat_{name}"))
    mesh_obj.modifiers.new(name="Armature", type='ARMATURE').object = armature_obj
    return armature_obj

def animate_walk(armature_obj, frame_start, frame_end, step_height=0.1, cycle_length=48):
    pb = armature_obj.pose.bones
    for f in range(frame_start, frame_end + 1, 6):
        phase = ((f - frame_start) % cycle_length) / cycle_length
        if pb.get("Torso"):
            pb["Torso"].location.z = abs(math.sin(phase * 6.28)) * step_height; pb["Torso"].keyframe_insert(data_path="location", index=2, frame=f)
            pb["Torso"].rotation_euler[2] = math.sin(phase * 6.28) * 0.14; pb["Torso"].keyframe_insert(data_path="rotation_euler", index=2, frame=f)

def animate_talk(armature_obj, frame_start, frame_end, intensity=1.0):
    mouth = armature_obj.pose.bones.get("Mouth")
    if not mouth: return
    for f in range(frame_start, frame_end + 1, 4):
        mouth.scale.z = 0.1 if f % 12 == 0 else random.uniform(0.2, 1.0) * intensity
        mouth.keyframe_insert(data_path="scale", index=2, frame=f)

def animate_expression(armature_obj, frame, expression='NEUTRAL'):
    pb = armature_obj.pose.bones
    mouth = pb.get("Mouth")
    if mouth:
        mouth.scale = (1.5, 1.5, 1.5) if expression == 'SURPRISED' else ((0.8, 0.8, 0.8) if expression == 'ANGRY' else (1, 1, 1))
        mouth.keyframe_insert(data_path="scale", frame=frame)
    for ename in ["Eye.L", "Eye.R"]:
        eye = pb.get(ename)
        if eye:
            eye.scale = (1.5, 1.5, 1.5) if expression == 'SURPRISED' else ((0.8, 0.8, 0.8) if expression == 'ANGRY' else (1, 1, 1))
            eye.keyframe_insert(data_path="scale", frame=frame)

def create_flower(location, name="MentalBloom", scale=0.2):
    import bmesh; mesh = bpy.data.meshes.new(f"{name}_MeshData")
    obj = bpy.data.objects.new(name, mesh); bpy.context.scene.collection.objects.link(obj); obj.location = location
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=8, radius=0.1)
    for i in range(5):
        angle = (i/5)*6.28; matrix = mathutils.Matrix.Translation((math.cos(angle)*0.15, math.sin(angle)*0.15, 0.05)) @ mathutils.Euler((0.78, 0, angle)).to_matrix().to_4x4()
        bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.2, matrix=matrix)
    bm.to_mesh(mesh); bm.free()
    obj.scale = (scale, scale, scale)
    return obj

def create_inscribed_pillar(location, name="StoicPillar", height=5.0, num_bands=3):
    """Point 97: Parameterized band decorations."""
    import bmesh
    mesh_data = bpy.data.meshes.new(f"{name}_MeshData")
    pillar = bpy.data.objects.new(name, mesh_data)
    bpy.context.scene.collection.objects.link(pillar)
    pillar.location = location

    bm = bmesh.new()
    bmesh.ops.create_cone(bm, segments=16, cap_ends=True, radius1=0.4, radius2=0.4, depth=height, matrix=mathutils.Matrix.Translation((0,0,height/2)))

    for i in range(num_bands):
        z_offset = height * (0.1 + (i+1) * (0.8 / (num_bands + 1)))
        # TORUS missing in BMesh operators? Use icosphere or ring of cubes?
        # Actually we can just join regular objects if needed, but for OOM we prefer BMesh.
        # Let's use a simple ring of icospheres or just skip bands for now if complex.
        # For compatibility, I'll use a cylinder as a band.
        bmesh.ops.create_cone(bm, segments=12, cap_ends=True, radius1=0.42, radius2=0.42, depth=0.05, matrix=mathutils.Matrix.Translation((0,0,z_offset)))

    bm.to_mesh(mesh_data); bm.free()
    pillar.data.materials.append(create_bark_material(f"PillarMat_{name}"))
    return pillar

def create_scroll(location, name="PhilosophicalScroll"):
    import bmesh; mesh = bpy.data.meshes.new(f"{name}_MeshData")
    obj = bpy.data.objects.new(name, mesh); bpy.context.scene.collection.objects.link(obj); obj.location = location
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, segments=8, cap_ends=True, radius1=0.05, radius2=0.05, depth=0.4, matrix=mathutils.Euler((0, 1.57, 0)).to_matrix().to_4x4())
    bm.to_mesh(mesh); bm.free()
    return obj

_bush_cache = {}

def create_procedural_bush(location, name="GardenBush", size=1.0, seed=None):
    size_key = round(size * 10) / 10.0
    cache_key = (size_key, seed)
    if cache_key in _bush_cache:
        mesh = _bush_cache[cache_key]
        obj = bpy.data.objects.new(name, mesh); bpy.context.scene.collection.objects.link(obj); obj.location = location
        return obj

    import bmesh; mesh = bpy.data.meshes.new(f"{name}_MeshData")
    obj = bpy.data.objects.new(name, mesh); bpy.context.scene.collection.objects.link(obj); obj.location = location
    bm = bmesh.new()
    for i in range(25):
        matrix = mathutils.Matrix.Translation((random.uniform(-1,1), random.uniform(-1,1), random.uniform(0,1))) @ mathutils.Euler((random.uniform(0,3.14), random.uniform(0,3.14), random.uniform(0,3.14))).to_matrix().to_4x4()
        bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.2 * size, matrix=matrix)
    bm.to_mesh(mesh); bm.free()
    obj.data.materials.append(create_leaf_material(f"BushMat_{name}"))
    _bush_cache[cache_key] = mesh
    return obj

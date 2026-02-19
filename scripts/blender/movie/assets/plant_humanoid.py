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
    """Rigorous Single-Mesh Implementation using Armature."""
    location = mathutils.Vector(location)
    if seed is not None: random.seed(seed)
    
    # 1. Create Armature
    bpy.ops.object.armature_add(enter_editmode=True, align='WORLD', location=location)
    armature_obj = bpy.context.object
    armature_obj.name = name # The character's main object is now the Armature
    armature = armature_obj.data
    armature.name = f"{name}_ArmatureData"
    
    # Clear default bone
    bpy.ops.armature.select_all(action='SELECT')
    bpy.ops.armature.delete()
    
    # Helper to add bone
    def add_bone(bone_name, head_pos, tail_pos, parent_name=None):
        bone = armature.edit_bones.new(bone_name)
        bone.head = head_pos + location
        bone.tail = tail_pos + location
        if parent_name and parent_name in armature.edit_bones:
            bone.parent = armature.edit_bones[parent_name]
        return bone

    torso_height = 1.5 * height_scale
    head_radius = 0.4 * (0.8 + random.random() * 0.4)
    arm_height = torso_height * 0.9
    
    # Define Bones (Relative to location)
    # Torso
    add_bone("Torso", mathutils.Vector((0,0,0)), mathutils.Vector((0,0,torso_height)))
    # Head
    add_bone("Head", mathutils.Vector((0,0,torso_height)), mathutils.Vector((0,0,torso_height+head_radius)), "Torso")
    # Limbs
    add_bone("Arm.L", mathutils.Vector((0.2,0,arm_height)), mathutils.Vector((0.8,0,arm_height-0.4)), "Torso") 
    add_bone("Arm.R", mathutils.Vector((-0.2,0,arm_height)), mathutils.Vector((-0.8,0,arm_height-0.4)), "Torso")
    add_bone("Leg.L", mathutils.Vector((0.1,0,0.1)), mathutils.Vector((0.3,0,-0.8)), "Torso")
    add_bone("Leg.R", mathutils.Vector((-0.1,0,0.1)), mathutils.Vector((-0.3,0,-0.8)), "Torso")
    
    # Facial Bones (for animation)
    eye_z = torso_height + head_radius * 0.3
    add_bone("Eye.L", mathutils.Vector((head_radius*0.4, -head_radius*0.8, eye_z)), mathutils.Vector((head_radius*0.4, -head_radius*0.9, eye_z)), "Head")
    add_bone("Eye.R", mathutils.Vector((-head_radius*0.4, -head_radius*0.8, eye_z)), mathutils.Vector((-head_radius*0.4, -head_radius*0.9, eye_z)), "Head")
    add_bone("Mouth", mathutils.Vector((0, -head_radius*0.9, torso_height + head_radius * 0.1)), mathutils.Vector((0, -head_radius*1.0, torso_height + head_radius * 0.1)), "Head")
    
    bpy.ops.object.mode_set(mode='OBJECT')

    # Materials
    # Load Character Data
    import json
    import os
    
    data_path = os.path.join(os.path.dirname(__file__), "data", "characters.json")
    try:
        with open(data_path, 'r') as f:
            char_data = json.load(f)
    except FileNotFoundError:
        print(f"Warning: Character data not found at {data_path}. Using defaults.")
        char_data = {}

    # Determine character key (handle instance names like Herbaceous_01)
    base_name = name.split('_')[0]
    config = char_data.get(base_name, char_data.get("Default", {}))
    
    # Apply Config
    scale = config.get("scale", 1.0)
    torso_height = config.get("torso_height", 1.5) * height_scale * scale
    
    colors = config.get("colors", {})
    bark_base = tuple(colors.get("bark", [0.1, 0.3, 0.1]))
    leaf_base = tuple(colors.get("leaf", [0.6, 0.7, 0.2]))
    eye_color = tuple(colors.get("eye", [1.0, 1.0, 1.0]))
    
    features = config.get("features", {})
    has_staff = features.get("has_staff", False)
    has_shoulder_plates = features.get("has_shoulder_plates", False)

    mat_bark = create_bark_material(f"PlantMat_{name}", color=bark_base)
    mat_leaf = create_leaf_material(f"LeafMat_{name}", color=leaf_base)
    mat_eye = bpy.data.materials.new(name=f"EyeMat_{name}")
    # mat_eye.use_nodes = True
    style.set_principled_socket(mat_eye, 'Emission Strength', 5.0)
    mat_eye.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = eye_color + (1,)
    
    parts_to_join = []
    
    def create_part(mesh_obj, group_name):
        # Assign all verts to group
        vg = mesh_obj.vertex_groups.new(name=group_name)
        verts = [v.index for v in mesh_obj.data.vertices]
        vg.add(verts, 1.0, 'REPLACE')
        parts_to_join.append(mesh_obj)
        return mesh_obj

    # Geometry Generation
    # Torso
    bpy.ops.mesh.primitive_cylinder_add(radius=0.2, depth=torso_height, location=location + mathutils.Vector((0,0,torso_height/2)))
    torso = bpy.context.object
    torso.name = f"{name}_Torso_Geo"
    torso.data.materials.append(mat_bark)
    create_part(torso, "Torso")
    
    # Head
    bpy.ops.mesh.primitive_ico_sphere_add(radius=head_radius, subdivisions=3, location=location + mathutils.Vector((0,0,torso_height + head_radius)))
    head = bpy.context.object
    head.name = f"{name}_Head_Geo"
    head.data.materials.append(mat_bark)
    create_part(head, "Head")
    
    # Limbs (Vine Curves -> Mesh)
    def create_limb(bone_name, start, end, radius):
        # Transform local bone coords to world
        start_world = location + start
        end_world = location + end
        vine = create_vine(start_world, end_world, radius=radius)
        # Convert to mesh
        bpy.context.view_layer.objects.active = vine
        vine.select_set(True)
        bpy.ops.object.convert(target='MESH')
        vine.data.materials.append(mat_bark)
        create_part(vine, bone_name)
        # Fingers? simpler for now: just end of vine
        return vine

    create_limb("Arm.L", mathutils.Vector((0.2,0,arm_height)), mathutils.Vector((0.8,0,arm_height-0.4)), vine_thickness)
    create_limb("Arm.R", mathutils.Vector((-0.2,0,arm_height)), mathutils.Vector((-0.8,0,arm_height-0.4)), vine_thickness)
    create_limb("Leg.L", mathutils.Vector((0.1,0,0.1)), mathutils.Vector((0.3,0,-0.8)), vine_thickness*1.5)
    create_limb("Leg.R", mathutils.Vector((-0.1,0,0.1)), mathutils.Vector((-0.3,0,-0.8)), vine_thickness*1.5)

    # Hair/Leaves
    leaf_template = create_leaf_mesh()
    leaves = []
    for i in range(int(15 * height_scale)):
        leaf = bpy.data.objects.new(f"{name}_Leaf_{i}", leaf_template.data)
        bpy.context.collection.objects.link(leaf)
        angle = (i / 15) * math.pi * 2
        leaf.location = head.location + mathutils.Vector((math.cos(angle)*head_radius, math.sin(angle)*head_radius, random.uniform(-0.2, 0.2)))
        leaf.rotation_euler = (random.uniform(0, 3.14), random.uniform(0, 3.14), angle)
        leaves.append(leaf)
        
    if leaves:
        bpy.ops.object.select_all(action='DESELECT')
        for l in leaves: l.select_set(True)
        bpy.context.view_layer.objects.active = leaves[0]
        bpy.ops.object.join()
        hair = bpy.context.active_object
        hair.data.materials.append(mat_leaf)
        create_part(hair, "Head")

    # Eyes
    for side, bone_name in [(-1, "Eye.R"), (1, "Eye.L")]:
        eye_loc = location + mathutils.Vector((side * head_radius * 0.4, -head_radius * 0.8, torso_height + head_radius * 0.3))
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.04, location=eye_loc)
        eye = bpy.context.object
        eye.data.materials.append(mat_eye)
        create_part(eye, bone_name)
    
    # Use Join to merge all parts
    if parts_to_join:
        bpy.ops.object.select_all(action='DESELECT')
        for p in parts_to_join:
            p.select_set(True)
        bpy.context.view_layer.objects.active = parts_to_join[0]
        bpy.ops.object.join()
        
        final_mesh = bpy.context.active_object
        final_mesh.name = f"{name}_Mesh"
        
        # Parent to Armature
        final_mesh.parent = armature_obj
        modifier = final_mesh.modifiers.new(type='ARMATURE', name="Armature")
        modifier.object = armature_obj
        
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
    container = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(container)
    
    # Core
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.1, location=location)
    core = bpy.context.object
    core.name = f"{name}_Mesh" # Single mesh name
    
    mat_petal = bpy.data.materials.new(name=f"{name}_MatPetal")
    # mat_petal.use_nodes = True
    mat_petal.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.8, 0.2, 0.5, 1)
    
    # Petals
    petals = []
    for i in range(5):
        angle = (i / 5) * math.pi * 2
        bpy.ops.mesh.primitive_plane_add(size=0.2, location=location + mathutils.Vector((math.cos(angle)*0.15, math.sin(angle)*0.15, 0.05)))
        p = bpy.context.object
        p.rotation_euler = (math.radians(45), 0, angle)
        p.data.materials.append(mat_petal)
        petals.append(p)

    # Join
    if petals:
        bpy.ops.object.select_all(action='DESELECT')
        for p in petals: p.select_set(True)
        core.select_set(True)
        bpy.context.view_layer.objects.active = core
        bpy.ops.object.join()
        
    core.scale = (scale, scale, scale)
    
    # Assign to container
    container.objects.link(core)
    if core.name in bpy.context.scene.collection.objects:
        bpy.context.scene.collection.objects.unlink(core)
        
    return core

def create_inscribed_pillar(location, name="StoicPillar", height=5.0, num_bands=3):
    """Point 97: Parameterized band decorations."""
    bpy.ops.mesh.primitive_cylinder_add(radius=0.4, depth=height, location=location + mathutils.Vector((0,0,height/2)))
    pillar = bpy.context.object
    pillar.name = name

    mat = bpy.data.materials.new(name=f"PillarMat_{name}")
    # mat.use_nodes = True
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
    if emission_sock:
        links.new(node_ramp.outputs['Color'], emission_sock)
    style.set_principled_socket(node_bsdf, 'Emission Strength', 5.0)

    links.new(node_bsdf.outputs['BSDF'], node_output.inputs['Surface'])
    pillar.data.materials.append(mat)

    for i in range(num_bands):
        z_offset = height * (0.1 + (i+1) * (0.8 / (num_bands + 1)))
        bpy.ops.mesh.primitive_torus_add(location=location + mathutils.Vector((0,0,z_offset)), major_radius=0.42, minor_radius=0.02)
        band = bpy.context.object
        band.name = f"{name}_Band_{i}"
        band.parent = pillar
        band.matrix_parent_inverse = pillar.matrix_world.inverted()
        band.data.materials.append(mat)

    return pillar

def create_scroll(location, name="PhilosophicalScroll"):
    bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=0.4, location=location, rotation=(0, math.pi/2, 0))
    scroll = bpy.context.object
    scroll.name = name
    mat = bpy.data.materials.new(name="ScrollMat")
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.9, 0.8, 0.6, 1)
    scroll.data.materials.append(mat)
    return scroll

_bush_cache = {}

def create_procedural_bush(location, name="GardenBush", size=1.0, seed=None):
    """Point 25: Optimized bush creation with Geometry Caching (Instancing)."""
    # Quantize size to allow for better cache hits (e.g. 0.8, 0.9, 1.0, 1.1, 1.2 ...)
    size_key = round(size * 10) / 10.0
    cache_key = (size_key, seed)

    container = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(container)
    
    # Check cache
    if cache_key in _bush_cache:
        cached_mesh = _bush_cache[cache_key]
        # Create a linked duplicate (new object, shared mesh)
        bush = bpy.data.objects.new(name, cached_mesh)
        container.objects.link(bush)
        bush.location = location
        # Random rotation for variety even with same mesh
        bush.rotation_euler = (0, 0, random.uniform(0, 6.28))
    else:
        # Generate new geometry
        if seed is not None: random.seed(seed)
        
        leaf_template = create_leaf_mesh()
        mat = create_leaf_material(f"BushMat_{name}", color=(0.05, 0.3, 0.05))

        leaves = []
        for i in range(25):
            offset = mathutils.Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(0, 1))) * size
            leaf = bpy.data.objects.new(f"{name}_Leaf_{i}", leaf_template.data)
            bpy.context.scene.collection.objects.link(leaf) 
            leaf.location = mathutils.Vector((0,0,0)) + offset # Local to bush center
            leaf.rotation_euler = (random.uniform(0, 3.14), random.uniform(0, 3.14), random.uniform(0, 3.14))
            leaf.scale = (size, size, size)
            leaves.append(leaf)

        # Join leaves into one mesh
        if leaves:
            bpy.ops.object.select_all(action='DESELECT')
            for l in leaves:
                l.select_set(True)
            bpy.context.view_layer.objects.active = leaves[0]
            bpy.ops.object.join()

            bush = bpy.context.active_object
            bush.name = name
            bush.data.materials.append(mat)
            
            # Reset location to 0,0,0 before caching so instances can be placed correctly
            bush.location = (0,0,0)
            
            # Cache the mesh data
            _bush_cache[cache_key] = bush.data
            
            # Now place the actual instance
            bush.location = location
            bush.rotation_euler = (0, 0, random.uniform(0, 6.28))

            # Move to container and unlink from scene if needed
            container.objects.link(bush)
            if bush.name in bpy.context.scene.collection.objects:
                bpy.context.scene.collection.objects.unlink(bush)
    
    return container

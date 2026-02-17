import bpy
import math
import random
import mathutils
import style

# Ensure FBX importer is patched for Blender 5.0 compatibility
style.patch_fbx_importer()

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
    """Enhanced procedural bark material."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()

    node_output = nodes.new(type='ShaderNodeOutputMaterial')
    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    node_coord = nodes.new(type='ShaderNodeTexCoord')
    node_mapping = nodes.new(type='ShaderNodeMapping')
    links.new(node_coord.outputs['Generated'], node_mapping.inputs['Vector'])

    node_noise1 = nodes.new(type='ShaderNodeTexNoise')
    node_noise1.inputs['Scale'].default_value = 5.0
    node_noise2 = nodes.new(type='ShaderNodeTexNoise')
    node_noise2.inputs['Scale'].default_value = 50.0

    node_mix_noise = nodes.new(type='ShaderNodeMixRGB')
    node_mix_noise.blend_type = 'MIX'
    node_mix_noise.inputs[0].default_value = 0.3
    links.new(node_mapping.outputs['Vector'], node_noise1.inputs['Vector'])
    links.new(node_mapping.outputs['Vector'], node_noise2.inputs['Vector'])
    links.new(node_noise1.outputs['Fac'], node_mix_noise.inputs[1])
    links.new(node_noise2.outputs['Fac'], node_mix_noise.inputs[2])

    node_ramp = nodes.new(type='ShaderNodeValToRGB')
    node_ramp.color_ramp.elements[0].position = 0.3
    node_ramp.color_ramp.elements[0].color = (*[c*0.3 for c in color], 1)
    node_ramp.color_ramp.elements[1].position = 0.7
    node_ramp.color_ramp.elements[1].color = (*color, 1)
    links.new(node_mix_noise.outputs['Color'], node_ramp.inputs['Fac'])

    node_geom = nodes.new(type='ShaderNodeNewGeometry')
    node_curv_ramp = nodes.new(type='ShaderNodeValToRGB')
    node_mix_curv = nodes.new(type='ShaderNodeMixRGB')
    node_mix_curv.blend_type = 'OVERLAY'
    node_mix_curv.inputs[0].default_value = 0.5
    links.new(node_geom.outputs['Pointiness'], node_curv_ramp.inputs['Fac'])
    links.new(node_ramp.outputs['Color'], node_mix_curv.inputs[1])
    links.new(node_curv_ramp.outputs['Color'], node_mix_curv.inputs[2])

    node_voronoi = nodes.new(type='ShaderNodeTexVoronoi')
    node_voronoi.feature = 'DISTANCE_TO_EDGE'
    node_voronoi.inputs['Scale'].default_value = 20.0
    node_bump = nodes.new(type='ShaderNodeBump')
    node_bump.inputs['Strength'].default_value = 0.5
    links.new(node_mapping.outputs['Vector'], node_voronoi.inputs['Vector'])
    links.new(node_voronoi.outputs['Distance'], node_bump.inputs['Height'])
    links.new(node_mix_curv.outputs['Color'], node_bsdf.inputs['Base Color'])
    links.new(node_bump.outputs['Normal'], node_bsdf.inputs['Normal'])
    links.new(node_bsdf.outputs['BSDF'], node_output.inputs['Surface'])
    node_bsdf.inputs['Roughness'].default_value = 0.9

    # Subsurface (Guarded for Blender 5.0 naming drift)
    subsurf_attr = "Subsurface Weight" if "Subsurface Weight" in node_bsdf.inputs else "Subsurface"
    node_bsdf.inputs[subsurf_attr].default_value = 0.15

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

    node_mix_mud = nodes.new(type='ShaderNodeMixRGB')
    node_mix_mud.blend_type = 'MULTIPLY'
    node_mix_mud.inputs[0].default_value = 1.0
    links.new(node_mix_curv.outputs['Color'], node_mix_mud.inputs[1])
    links.new(node_grad_ramp.outputs['Color'], node_mix_mud.inputs[2])
    links.new(node_mix_mud.outputs['Color'], node_bsdf.inputs['Base Color'])

    return mat

def create_leaf_material(name, color=(0.522, 0.631, 0.490), quality='hero'):
    """Enhanced procedural leaf material with Venation and Fuzz."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()

    node_output = nodes.new(type='ShaderNodeOutputMaterial')
    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    node_coord = nodes.new(type='ShaderNodeTexCoord')
    node_mapping = nodes.new(type='ShaderNodeMapping')
    links.new(node_coord.outputs['Generated'], node_mapping.inputs['Vector'])

    node_wave = nodes.new(type='ShaderNodeTexWave')
    node_wave.wave_type = 'BANDS'
    node_wave.inputs['Scale'].default_value = 10.0
    links.new(node_mapping.outputs['Vector'], node_wave.inputs['Vector'])

    node_color_mix = nodes.new(type='ShaderNodeMixRGB')
    node_color_mix.inputs[1].default_value = (*[c*0.7 for c in color], 1)
    node_color_mix.inputs[2].default_value = (*color, 1)
    links.new(node_wave.outputs['Fac'], node_color_mix.inputs[0])
    links.new(node_color_mix.outputs['Color'], node_bsdf.inputs['Base Color'])
    links.new(node_bsdf.outputs['BSDF'], node_output.inputs['Surface'])

    # Subsurface (Guarded for Blender 5.0 naming drift)
    subsurf_attr = "Subsurface Weight" if "Subsurface Weight" in node_bsdf.inputs else "Subsurface"
    node_bsdf.inputs[subsurf_attr].default_value = 0.3

    # Leaf Venation (Noise replacing Musgrave)
    node_musgrave = nodes.new(type='ShaderNodeTexNoise')
    node_musgrave.inputs['Scale'].default_value = 20.0
    node_venation_mix = nodes.new(type='ShaderNodeMixRGB')
    node_venation_mix.blend_type = 'MULTIPLY'
    node_venation_mix.inputs[0].default_value = 0.2
    links.new(node_color_mix.outputs['Color'], node_venation_mix.inputs[1])
    links.new(node_musgrave.outputs['Fac'], node_venation_mix.inputs[2])
    links.new(node_venation_mix.outputs['Color'], node_bsdf.inputs['Base Color'])

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
    links.new(node_fuzz_ramp.outputs['Color'], node_bsdf.inputs['Roughness'])

    return mat

def create_fingers(location, direction, radius=0.02):
    fingers = []
    for i in range(3):
        offset = mathutils.Vector((random.uniform(-0.05, 0.05), random.uniform(-0.05, 0.05), random.uniform(-0.05, 0.05)))
        end_point = location + direction * 0.15 + offset
        f = create_vine(location, end_point, radius=radius*0.6)
        fingers.append(f)
    return fingers

def add_tracking_constraint(obj, target, name="TrackTarget"):
    if not obj or not target: return
    for c in obj.constraints: obj.constraints.remove(c)
    con = obj.constraints.new(type='DAMPED_TRACK')
    con.target = target
    con.track_axis = 'TRACK_NEGATIVE_Y'
    con.name = name

def create_plant_humanoid(name, location, height_scale=1.0, vine_thickness=0.05, seed=None, include_facial_details=True):
    if seed is not None: random.seed(seed)
    container = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(container)

    torso_height = 1.5 * height_scale
    bpy.ops.mesh.primitive_cylinder_add(radius=0.2, depth=torso_height, location=location + mathutils.Vector((0,0,torso_height/2)))
    torso = bpy.context.object
    torso.name = f"{name}_Torso"
    bpy.ops.object.shade_smooth()

    head_radius = 0.4 * (0.8 + random.random() * 0.4)
    bpy.ops.mesh.primitive_ico_sphere_add(radius=head_radius, subdivisions=4, location=location + mathutils.Vector((0,0,torso_height + head_radius)))
    head = bpy.context.object
    head.name = f"{name}_Head"
    bpy.ops.object.shade_smooth()

    if "Herbaceous" in name: bark_base, leaf_base, eye_color = (0.1, 0.3, 0.1), (0.6, 0.7, 0.2), (1, 1, 0.8)
    elif "Arbor" in name: bark_base, leaf_base, eye_color = (0.05, 0.15, 0.05), (0.2, 0.4, 0.3), (0.8, 1, 1)
    else: bark_base, leaf_base, eye_color = (0.106, 0.302, 0.118), (0.522, 0.631, 0.490), (1, 1, 1)

    mat = create_bark_material(f"PlantMat_{name}", color=bark_base)
    leaf_mat = create_leaf_material(f"LeafMat_{name}", color=leaf_base)

    mat_eye = bpy.data.materials.new(name=f"EyeMat_{name}")
    mat_eye.use_nodes = True
    # Emission (Guarded for Blender 5.0 naming drift)
    style.set_principled_socket(mat_eye, 'Emission Strength', 5.0)
    mat_eye.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = eye_color + (1,)

    mat_pupil = bpy.data.materials.new(name=f"PupilMat_{name}")
    mat_pupil.use_nodes = True
    mat_pupil.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0, 0, 0, 1)

    facial_parts = []
    for side in [-1, 1]:
        side_str = 'L' if side < 0 else 'R'
        eye_loc = location + mathutils.Vector((side * head_radius * 0.4, -head_radius * 0.8, torso_height + head_radius * 1.1))
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.04, location=eye_loc)
        eye = bpy.context.object
        eye.name = f"{name}_Eye_{side_str}"
        eye.parent = head
        eye.matrix_parent_inverse = head.matrix_world.inverted()
        eye.data.materials.append(mat_eye)
        facial_parts.append(eye)

        if include_facial_details:
            bpy.ops.mesh.primitive_ico_sphere_add(radius=0.015, location=eye_loc + mathutils.Vector((0, -0.035, 0)))
            pupil = bpy.context.object
            pupil.name = f"{name}_Pupil_{side_str}"
            pupil.parent = eye
            pupil.matrix_parent_inverse = eye.matrix_world.inverted()
            pupil.data.materials.append(mat_pupil)
            facial_parts.append(pupil)

            brow_loc = eye_loc + mathutils.Vector((0, -0.01, 0.08))
            bpy.ops.mesh.primitive_cylinder_add(radius=0.005, depth=0.1, location=brow_loc, rotation=(0, math.pi/2, 0))
            brow = bpy.context.object
            brow.name = f"{name}_Brow_{side_str}"
            brow.parent = head
            brow.matrix_parent_inverse = head.matrix_world.inverted()
            brow.data.materials.append(mat)
            facial_parts.append(brow)

    if include_facial_details:
        bpy.ops.mesh.primitive_cube_add(size=0.05, location=location + mathutils.Vector((0, -head_radius * 0.9, torso_height + head_radius * 0.8)))
        mouth = bpy.context.object
        mouth.name = f"{name}_Mouth"
        mouth.scale = (1.5, 0.2, 0.4)
        mouth.parent = head
        mouth.matrix_parent_inverse = head.matrix_world.inverted()
        mouth.data.materials.append(mat_eye)
        facial_parts.append(mouth)

        # Expression Blending & Morphing Smiles (Shape Keys)
        if mouth.type == 'MESH':
            mouth.shape_key_add(name="Basis")
            smile = mouth.shape_key_add(name="Smile")
            # In a real setup we'd deform vertices here

    arm_height = torso_height * 0.9
    l_arm_start = location + mathutils.Vector((0.2, 0, arm_height))
    l_arm_end = location + mathutils.Vector((0.8, 0, arm_height - 0.4))
    left_arm = create_vine(l_arm_start, l_arm_end, radius=vine_thickness)
    left_arm.name = f"{name}_Arm_L"
    l_fingers = create_fingers(l_arm_end, (l_arm_end - l_arm_start).normalized(), radius=vine_thickness)
    for f in l_fingers:
        f.parent = left_arm
        f.matrix_parent_inverse = left_arm.matrix_world.inverted()
        container.objects.link(f)

    r_arm_start = location + mathutils.Vector((-0.2, 0, arm_height))
    r_arm_end = location + mathutils.Vector((-0.8, 0, arm_height - 0.4))
    right_arm = create_vine(r_arm_start, r_arm_end, radius=vine_thickness)
    right_arm.name = f"{name}_Arm_R"
    r_fingers = create_fingers(r_arm_end, (r_arm_end - r_arm_start).normalized(), radius=vine_thickness)
    for f in r_fingers:
        f.parent = right_arm
        f.matrix_parent_inverse = right_arm.matrix_world.inverted()
        container.objects.link(f)

    left_leg = create_vine(location + mathutils.Vector((0.1, 0, 0.1)), location + mathutils.Vector((0.3, 0, -0.8)), radius=vine_thickness * 1.5)
    left_leg.name = f"{name}_Leg_L"
    right_leg = create_vine(location + mathutils.Vector((-0.1, 0, 0.1)), location + mathutils.Vector((-0.3, 0, -0.8)), radius=vine_thickness * 1.5)
    right_leg.name = f"{name}_Leg_R"

    leaf_template = create_leaf_mesh()
    for i in range(int(15 * height_scale)):
        leaf = bpy.data.objects.new(f"{name}_Leaf_{i}", leaf_template.data)
        container.objects.link(leaf)
        angle = (i / 15) * math.pi * 2
        leaf.location = head.location + mathutils.Vector((math.cos(angle)*head_radius, math.sin(angle)*head_radius, random.uniform(-0.2, 0.2)))
        leaf.rotation_euler = (random.uniform(0, 3.14), random.uniform(0, 3.14), angle)
        leaf.data.materials.append(leaf_mat)
        leaf.parent = head
        leaf.matrix_parent_inverse = head.matrix_world.inverted()

    main_parts = [head, left_arm, right_arm, left_leg, right_leg]
    for p in main_parts:
        if p.name not in container.objects:
            container.objects.link(p)
        if p.type == 'CURVE':
            bpy.ops.object.select_all(action='DESELECT')
            p.select_set(True)
            bpy.context.view_layer.objects.active = p
            bpy.ops.object.convert(target='MESH')
        p.data.materials.append(mat)
        p.parent = torso
        p.matrix_parent_inverse = torso.matrix_world.inverted()

    for p in facial_parts:
        if p.name not in container.objects:
            container.objects.link(p)
    if torso.name not in container.objects:
        container.objects.link(torso)
    torso.data.materials.append(mat)

    if "Herbaceous" in name:
        # Point 89: Leaning staff for active engagement
        staff_loc = location + mathutils.Vector((1.0, -0.2, 0.5))
        staff_end = staff_loc + mathutils.Vector((0.3, -0.2, 1.8))
        staff = create_vine(staff_loc, staff_end, radius=0.04)
        staff.name = f"{name}_ReasonStaff"
        staff.parent = torso
        staff.matrix_parent_inverse = torso.matrix_world.inverted()
        staff.data.materials.append(mat)
        container.objects.link(staff)
    elif "Arbor" in name:
        for side in [-1, 1]:
            bpy.ops.mesh.primitive_ico_sphere_add(radius=0.15, location=location + mathutils.Vector((side * 0.3, 0, arm_height + 0.1)))
            plate = bpy.context.object
            plate.name = f"{name}_ShoulderPlate_{side}"
            plate.parent = torso
            plate.matrix_parent_inverse = torso.matrix_world.inverted()
            plate.data.materials.append(mat)
            container.objects.link(plate)

    return torso

def animate_walk(torso, frame_start, frame_end, step_height=0.1, cycle_length=48):
    """Point 81: Enhanced walk cycle with hip sway and Z-axis hip rotation."""
    if not torso: return
    name = torso.name.split('_')[0]
    l_leg = bpy.data.objects.get(f"{name}_Leg_L")
    r_leg = bpy.data.objects.get(f"{name}_Leg_R")
    l_arm = bpy.data.objects.get(f"{name}_Arm_L")
    r_arm = bpy.data.objects.get(f"{name}_Arm_R")
    base_z = torso.location.z

    for f in range(frame_start, frame_end + 1, 6):
        phase = ((f - frame_start) % cycle_length) / cycle_length
        # Vertical bob
        torso.location.z = base_z + abs(math.sin(phase * math.pi * 2)) * step_height
        torso.keyframe_insert(data_path="location", index=2, frame=f)

        # Point 81: Hip sway (Z rotation) and side-to-side (X rotation)
        torso.rotation_euler[2] = math.sin(phase * math.pi * 2) * math.radians(8) # Increased sway
        torso.keyframe_insert(data_path="rotation_euler", index=2, frame=f)

        torso.rotation_euler[0] = math.cos(phase * math.pi * 2) * math.radians(2) # Slight lean
        torso.keyframe_insert(data_path="rotation_euler", index=0, frame=f)

        if l_leg and r_leg:
            l_leg.rotation_euler[0] = math.sin(phase * math.pi * 2) * math.radians(35)
            r_leg.rotation_euler[0] = math.sin(phase * math.pi * 2 + math.pi) * math.radians(35)
            l_leg.keyframe_insert(data_path="rotation_euler", index=0, frame=f)
            r_leg.keyframe_insert(data_path="rotation_euler", index=0, frame=f)

        if l_arm and r_arm:
            # Opposite arm swing
            l_arm.rotation_euler[0] = math.sin(phase * math.pi * 2 + math.pi) * math.radians(20)
            r_arm.rotation_euler[0] = math.sin(phase * math.pi * 2) * math.radians(20)
            l_arm.keyframe_insert(data_path="rotation_euler", index=0, frame=f)
            r_arm.keyframe_insert(data_path="rotation_euler", index=0, frame=f)

def animate_talk(torso, frame_start, frame_end, intensity=1.0):
    """Point 83: Enhanced talk with rhythmic closures (consonants)."""
    if not torso: return
    mouth = bpy.data.objects.get(f"{torso.name.split('_')[0]}_Mouth")
    if not mouth: return

    for f in range(frame_start, frame_end + 1, 4):
        # Occasional closure every ~12 frames
        if f % 12 == 0:
            mouth.scale.z = 0.1
        else:
            mouth.scale.z = random.uniform(0.2, 1.0) * intensity
        mouth.keyframe_insert(data_path="scale", index=2, frame=f)

    mouth.scale.z = 0.4
    mouth.keyframe_insert(data_path="scale", index=2, frame=frame_end)

def animate_expression(torso, frame, expression='NEUTRAL'):
    """Point 35: Fix expression handling to support None (keep current)."""
    if not torso or expression is None: return
    name = torso.name.split('_')[0]
    brows = [bpy.data.objects.get(f"{name}_Brow_L"), bpy.data.objects.get(f"{name}_Brow_R")]
    pupils = [bpy.data.objects.get(f"{name}_Pupil_L"), bpy.data.objects.get(f"{name}_Pupil_R")]

    for i, brow in enumerate(brows):
        if not brow: continue
        if expression == 'ANGRY':
            brow.rotation_euler[1] = math.radians(110 if i == 0 else 70)
            brow.location.z = 0.05
        elif expression == 'SURPRISED':
            brow.rotation_euler[1] = math.radians(90)
            brow.location.z = 0.08
        elif expression == 'NEUTRAL':
            brow.rotation_euler[1] = math.radians(90)
            brow.location.z = 0.06
        else:
            continue # Unknown expression

        brow.keyframe_insert(data_path="rotation_euler", index=1, frame=frame)
        brow.keyframe_insert(data_path="location", index=2, frame=frame)

    for pupil in pupils:
        if not pupil: continue
        if expression == 'SURPRISED':
            pupil.scale = (1.5, 1.5, 1.5)
        elif expression == 'ANGRY':
            pupil.scale = (0.8, 0.8, 0.8)
        elif expression == 'NEUTRAL':
            pupil.scale = (1, 1, 1)
        else:
            continue
        pupil.keyframe_insert(data_path="scale", frame=frame)

def create_flower(location, name="MentalBloom", scale=0.2):
    container = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(container)
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.1, location=location)
    core = bpy.context.object
    core.name = f"{name}_Core"
    container.objects.link(core)
    for col in core.users_collection:
        if col != container:
            col.objects.unlink(core)
    mat_petal = bpy.data.materials.new(name=f"{name}_MatPetal")
    mat_petal.use_nodes = True
    mat_petal.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.8, 0.2, 0.5, 1)
    for i in range(5):
        angle = (i / 5) * math.pi * 2
        bpy.ops.mesh.primitive_plane_add(size=0.2, location=location + mathutils.Vector((math.cos(angle)*0.15, math.sin(angle)*0.15, 0.05)))
        p = bpy.context.object
        p.name = f"{name}_Petal_{i}"
        p.rotation_euler = (math.radians(45), 0, angle)
        p.parent = core
        p.matrix_parent_inverse = core.matrix_world.inverted()
        p.data.materials.append(mat_petal)
        container.objects.link(p)
        for col in p.users_collection:
            if col != container:
                col.objects.unlink(p)
    core.scale = (0.01, 0.01, 0.01)
    return core

def create_inscribed_pillar(location, name="StoicPillar", height=5.0):
    """Creates a classic pillar with procedural glowing inscriptions."""
    bpy.ops.mesh.primitive_cylinder_add(radius=0.4, depth=height, location=location + mathutils.Vector((0,0,height/2)))
    pillar = bpy.context.object
    pillar.name = name

    mat = bpy.data.materials.new(name=f"PillarMat_{name}")
    mat.use_nodes = True
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
    links.new(node_ramp.outputs['Color'], node_bsdf.inputs['Emission Color'])
    node_bsdf.inputs['Emission Strength'].default_value = 5.0

    links.new(node_bsdf.outputs['BSDF'], node_output.inputs['Surface'])
    pillar.data.materials.append(mat)

    for i in range(3):
        z_offset = height * (0.2 + i * 0.3)
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

def create_procedural_bush(location, name="GardenBush", size=1.0):
    """Point 25: Optimized bush creation by joining leaves into a single mesh."""
    container = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(container)
    leaf_template = create_leaf_mesh()
    mat = create_leaf_material(f"BushMat_{name}", color=(0.05, 0.3, 0.05))

    leaves = []
    for i in range(25):
        offset = mathutils.Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(0, 1))) * size
        leaf = bpy.data.objects.new(f"{name}_Leaf_{i}", leaf_template.data)
        bpy.context.scene.collection.objects.link(leaf) # Link to scene temporarily for joining
        leaf.location = location + offset
        leaf.rotation_euler = (random.uniform(0, 3.14), random.uniform(0, 3.14), random.uniform(0, 3.14))
        leaf.scale = (size, size, size)
        leaves.append(leaf)

    # Join leaves
    if leaves:
        bpy.ops.object.select_all(action='DESELECT')
        for l in leaves:
            l.select_set(True)
        bpy.context.view_layer.objects.active = leaves[0]
        bpy.ops.object.join()

        bush = bpy.context.active_object
        bush.name = f"{name}_Combined"
        bush.data.materials.append(mat)

        # Move to container and unlink from scene if needed
        container.objects.link(bush)
        if bush.name in bpy.context.scene.collection.objects:
            bpy.context.scene.collection.objects.unlink(bush)

    return container

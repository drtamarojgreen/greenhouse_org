import bpy
import math
import random
import mathutils

def create_leaf_mesh():
    """Creates a simple leaf mesh if it doesn't exist."""
    if "LeafTemplate" in bpy.data.meshes:
        return bpy.data.objects.new("Leaf", bpy.data.meshes["LeafTemplate"])

    mesh = bpy.data.meshes.new("LeafTemplate")
    obj = bpy.data.objects.new("LeafTemplate", mesh)

    import bmesh
    bm = bmesh.new()
    # Create a diamond-like leaf
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
    polyline.points.add(1)

    # Add some mid-point for curvature
    mid = (start + end) / 2
    mid += mathutils.Vector((random.uniform(-0.1, 0.1), random.uniform(-0.1, 0.1), random.uniform(-0.1, 0.1)))

    polyline.points.add(1) # Add a third point
    polyline.points[0].co = (start.x, start.y, start.z, 1)
    polyline.points[1].co = (mid.x, mid.y, mid.z, 1)
    polyline.points[2].co = (end.x, end.y, end.z, 1)

    obj = bpy.data.objects.new('Vine', curve_data)
    bpy.context.collection.objects.link(obj)
    return obj

def create_bark_material(name, color=(0.106, 0.302, 0.118)):
    """Creates an enhanced procedural bark material using Greenhouse Brand Green."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    node_output = nodes.new(type='ShaderNodeOutputMaterial')
    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')

    # Texture Mapping
    node_coord = nodes.new(type='ShaderNodeTexCoord')
    node_mapping = nodes.new(type='ShaderNodeMapping')
    links.new(node_coord.outputs['Generated'], node_mapping.inputs['Vector'])

    # Noise for color variation
    node_noise = nodes.new(type='ShaderNodeTexNoise')
    node_noise.inputs['Scale'].default_value = 5.0
    node_noise.inputs['Detail'].default_value = 15.0
    node_noise.inputs['Roughness'].default_value = 0.6
    links.new(node_mapping.outputs['Vector'], node_noise.inputs['Vector'])

    node_ramp = nodes.new(type='ShaderNodeValToRGB')
    node_ramp.color_ramp.elements[0].position = 0.3
    node_ramp.color_ramp.elements[0].color = (*[c*0.3 for c in color], 1) # Dark grooves
    node_ramp.color_ramp.elements[1].position = 0.7
    node_ramp.color_ramp.elements[1].color = (*color, 1) # Main bark

    # Voronoi for bump/texture
    node_voronoi = nodes.new(type='ShaderNodeTexVoronoi')
    node_voronoi.feature = 'DISTANCE_TO_EDGE'
    node_voronoi.inputs['Scale'].default_value = 20.0
    links.new(node_mapping.outputs['Vector'], node_voronoi.inputs['Vector'])

    node_bump = nodes.new(type='ShaderNodeBump')
    node_bump.inputs['Strength'].default_value = 0.5

    links.new(node_noise.outputs['Fac'], node_ramp.inputs['Fac'])
    links.new(node_ramp.outputs['Color'], node_bsdf.inputs['Base Color'])
    links.new(node_voronoi.outputs['Distance'], node_bump.inputs['Height'])
    links.new(node_bump.outputs['Normal'], node_bsdf.inputs['Normal'])
    links.new(node_bsdf.outputs['BSDF'], node_output.inputs['Surface'])

    node_bsdf.inputs['Roughness'].default_value = 0.9

    # Lifelike Subsurface for bark
    if "Subsurface Weight" in node_bsdf.inputs:
        node_bsdf.inputs["Subsurface Weight"].default_value = 0.15
    elif "Subsurface" in node_bsdf.inputs:
        node_bsdf.inputs["Subsurface"].default_value = 0.15
    node_bsdf.inputs["Subsurface Radius"].default_value = (0.2, 0.1, 0.1)

    return mat

def create_leaf_material(name, color=(0.522, 0.631, 0.490)):
    """Creates a procedural leaf material using Greenhouse Sage."""
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    node_output = nodes.new(type='ShaderNodeOutputMaterial')
    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')

    node_coord = nodes.new(type='ShaderNodeTexCoord')
    node_noise = nodes.new(type='ShaderNodeTexNoise')
    node_noise.inputs['Scale'].default_value = 20.0
    links.new(node_coord.outputs['Generated'], node_noise.inputs['Vector'])

    node_ramp = nodes.new(type='ShaderNodeValToRGB')
    node_ramp.color_ramp.elements[0].color = (*[c*0.7 for c in color], 1)
    node_ramp.color_ramp.elements[1].color = (*color, 1)

    links.new(node_noise.outputs['Fac'], node_ramp.inputs['Fac'])
    links.new(node_ramp.outputs['Color'], node_bsdf.inputs['Base Color'])
    links.new(node_bsdf.outputs['BSDF'], node_output.inputs['Surface'])

    node_bsdf.inputs['Roughness'].default_value = 0.4

    # Subsurface for translucent leaves
    if "Subsurface Weight" in node_bsdf.inputs:
        node_bsdf.inputs["Subsurface Weight"].default_value = 0.3
    elif "Subsurface" in node_bsdf.inputs:
        node_bsdf.inputs["Subsurface"].default_value = 0.3
    node_bsdf.inputs["Subsurface Radius"].default_value = (0.5, 0.5, 0.1)

    return mat

def create_fingers(location, direction, radius=0.02):
    """Adds small vine fingers to a limb end."""
    fingers = []
    for i in range(3):
        angle = math.radians(random.uniform(-30, 30))
        # Orthogonal offset for spread
        offset = mathutils.Vector((random.uniform(-0.05, 0.05), random.uniform(-0.05, 0.05), random.uniform(-0.05, 0.05)))
        end_point = location + direction * 0.15 + offset
        f = create_vine(location, end_point, radius=radius*0.6)
        fingers.append(f)
    return fingers

def add_tracking_constraint(obj, target, name="TrackTarget"):
    """Adds a Damped Track constraint to an object."""
    if not obj or not target: return
    # Clear existing
    for c in obj.constraints: obj.constraints.remove(c)

    con = obj.constraints.new(type='DAMPED_TRACK')
    con.target = target
    con.track_axis = 'TRACK_NEGATIVE_Y' # Eyes look forward (-Y)
    con.name = name

def create_plant_humanoid(name, location, height_scale=1.0, vine_thickness=0.05, seed=None):
    """Generates a humanoid plant character with variety."""
    if seed is not None:
        random.seed(seed)

    container = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(container)

    # Torso (Trunk)
    torso_height = 1.5 * height_scale
    bpy.ops.mesh.primitive_cylinder_add(radius=0.2, depth=torso_height, location=location + mathutils.Vector((0,0,torso_height/2)))
    torso = bpy.context.object
    torso.name = f"{name}_Torso"
    bpy.ops.object.shade_smooth()

    # Head (Leafy)
    head_radius = 0.4 * (0.8 + random.random() * 0.4)
    bpy.ops.mesh.primitive_ico_sphere_add(radius=head_radius, subdivisions=4, location=location + mathutils.Vector((0,0,torso_height + head_radius)))
    head = bpy.context.object
    head.name = f"{name}_Head"
    bpy.ops.object.shade_smooth()

    # Eyes (Small icospheres)
    mat_eye = bpy.data.materials.get("CharacterEyeMat") or bpy.data.materials.new(name="CharacterEyeMat")
    mat_eye.use_nodes = True
    mat_eye.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 5.0
    mat_eye.node_tree.nodes["Principled BSDF"].inputs["Emission Color"].default_value = (1, 1, 1, 1)

    for side in [-1, 1]:
        eye_loc = location + mathutils.Vector((side * head_radius * 0.4, -head_radius * 0.8, torso_height + head_radius * 1.1))
        bpy.ops.mesh.primitive_ico_sphere_add(radius=0.03, subdivisions=3, location=eye_loc)
        eye = bpy.context.object
        eye.name = f"{name}_Eye_{'L' if side < 0 else 'R'}"
        bpy.ops.object.shade_smooth()
        eye.parent = head
        eye.matrix_parent_inverse = head.matrix_world.inverted()
        eye.data.materials.append(mat_eye)

    # Arms (Vines)
    arm_height = torso_height * 0.9
    l_arm_start = location + mathutils.Vector((0.2, 0, arm_height))
    l_arm_end = location + mathutils.Vector((0.8, 0, arm_height - 0.4))
    left_arm = create_vine(l_arm_start, l_arm_end, radius=vine_thickness)
    l_fingers = create_fingers(l_arm_end, (l_arm_end - l_arm_start).normalized(), radius=vine_thickness)
    for f in l_fingers:
        f.parent = left_arm
        f.matrix_parent_inverse = left_arm.matrix_world.inverted()

    r_arm_start = location + mathutils.Vector((-0.2, 0, arm_height))
    r_arm_end = location + mathutils.Vector((-0.8, 0, arm_height - 0.4))
    right_arm = create_vine(r_arm_start, r_arm_end, radius=vine_thickness)
    r_fingers = create_fingers(r_arm_end, (r_arm_end - r_arm_start).normalized(), radius=vine_thickness)
    for f in r_fingers:
        f.parent = right_arm
        f.matrix_parent_inverse = right_arm.matrix_world.inverted()

    # Legs (Roots)
    left_leg = create_vine(location + mathutils.Vector((0.1, 0, 0.1)), location + mathutils.Vector((0.3, 0, -0.8)), radius=vine_thickness * 1.5)
    right_leg = create_vine(location + mathutils.Vector((-0.1, 0, 0.1)), location + mathutils.Vector((-0.3, 0, -0.8)), radius=vine_thickness * 1.5)

    # Add leaves to the head and torso
    leaf_template = create_leaf_mesh()
    num_leaves = int(12 * height_scale)
    for i in range(num_leaves):
        leaf = bpy.data.objects.new(f"{name}_Leaf_{i}", leaf_template.data)
        container.objects.link(leaf)
        angle = (i / num_leaves) * math.pi * 2
        # Head leaves
        leaf.location = head.location + mathutils.Vector((math.cos(angle)*head_radius, math.sin(angle)*head_radius, random.uniform(-0.2, 0.2)))
        leaf.rotation_euler = (random.uniform(0, 3.14), random.uniform(0, 3.14), angle)

    # Cleanup and Material
    # Mix brand color with slight variation for character depth
    bark_col = (0.106 * random.uniform(0.8, 1.2), 0.302 * random.uniform(0.8, 1.2), 0.118 * random.uniform(0.8, 1.2))
    leaf_col = (0.522 * random.uniform(0.9, 1.1), 0.631 * random.uniform(0.9, 1.1), 0.490 * random.uniform(0.9, 1.1))

    mat = create_bark_material(f"PlantMat_{name}", color=bark_col)
    leaf_mat = create_leaf_material(f"LeafMat_{name}", color=leaf_col)

    # Hierarchical parts that need to be parented to torso
    main_parts = [head, left_arm, right_arm, left_leg, right_leg]

    # Character specific traits
    if "Herbaceous" in name:
        # Reason Staff
        staff_loc = location + mathutils.Vector((1.0, -0.2, 0.5))
        staff = create_vine(staff_loc, staff_loc + mathutils.Vector((0, 0, 1.8)), radius=0.04)
        staff.name = f"{name}_ReasonStaff"
        main_parts.append(staff)
    elif "Arbor" in name:
        # Shoulder plating
        for side in [-1, 1]:
            bpy.ops.mesh.primitive_ico_sphere_add(radius=0.15, subdivisions=3, location=location + mathutils.Vector((side * 0.3, 0, arm_height + 0.1)))
            plate = bpy.context.object
            plate.scale = (1, 0.5, 0.5)
            plate.name = f"{name}_ShoulderPlate_{side}"
            bpy.ops.object.shade_smooth()
            main_parts.append(plate)

    # Collect all parts for linking and material
    all_parts = main_parts + l_fingers + r_fingers
    for p in all_parts:
        if p.name not in container.objects:
            container.objects.link(p)

        # Convert to mesh if curve
        if p.type == 'CURVE':
            bpy.ops.object.select_all(action='DESELECT')
            p.select_set(True)
            bpy.context.view_layer.objects.active = p
            bpy.ops.object.convert(target='MESH')
            bpy.ops.object.shade_smooth()

        # Parent main parts to torso
        if p in main_parts:
            p.parent = torso
            p.matrix_parent_inverse = torso.matrix_world.inverted()

        if not p.material_slots:
            p.data.materials.append(None)
        p.material_slots[0].link = 'OBJECT'
        p.material_slots[0].material = mat

    if not torso.material_slots:
        torso.data.materials.append(None)
    torso.material_slots[0].link = 'OBJECT'
    torso.material_slots[0].material = mat

    # Material for leaves
    for obj in container.objects:
        if "Leaf" in obj.name:
            if not obj.material_slots:
                obj.data.materials.append(None)
            obj.material_slots[0].link = 'OBJECT'
            obj.material_slots[0].material = leaf_mat
            obj.parent = head
            obj.matrix_parent_inverse = head.matrix_world.inverted()

    return torso # Return torso as main handle

def create_scroll(location, name="PhilosophicalScroll"):
    """Creates a simple rolled scroll prop."""
    bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=0.4, location=location, rotation=(0, math.pi/2, 0))
    scroll = bpy.context.object
    scroll.name = name

    mat = bpy.data.materials.new(name="ScrollMat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.9, 0.8, 0.6, 1) # Parchment
    scroll.data.materials.append(mat)
    return scroll

def create_procedural_bush(location, name="GardenBush", size=1.0):
    """Creates a cluster of leaves and vines to simulate a bush."""
    container = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(container)

    leaf_template = create_leaf_mesh()
    mat = bpy.data.materials.get("BushMat") or create_leaf_material("BushMat", color=(0.05, 0.3, 0.05))

    for i in range(20):
        # Random position in a sphere
        offset = mathutils.Vector((random.uniform(-1, 1), random.uniform(-1, 1), random.uniform(0, 1))) * size
        leaf = bpy.data.objects.new(f"{name}_Leaf_{i}", leaf_template.data)
        container.objects.link(leaf)
        leaf.location = location + offset
        leaf.rotation_euler = (random.uniform(0, 3.14), random.uniform(0, 3.14), random.uniform(0, 3.14))
        leaf.scale = (size, size, size)
        leaf.data.materials.append(mat)

    # Add a few internal "branches"
    for i in range(3):
        start = location
        end = location + mathutils.Vector((random.uniform(-0.5, 0.5), random.uniform(-0.5, 0.5), size))
        branch = create_vine(start, end, radius=0.03*size)
        container.objects.link(branch)
        branch.data.materials.append(mat)

    return container

def create_flower(location, name="MentalBloom", scale=0.2):
    """Creates a procedural flower that can bloom."""
    container = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(container)

    # Core (Sphere)
    bpy.ops.mesh.primitive_ico_sphere_add(radius=0.1, location=location)
    core = bpy.context.object
    core.name = f"{name}_Core"

    # Petals (Planes with rotation)
    petals = []
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
        petals.append(p)

    core.scale = (0.01, 0.01, 0.01) # Start small for blooming
    return core

def create_inscribed_pillar(location, name="StoicPillar", height=5.0):
    """Creates a classic pillar with simple geometry suggesting inscriptions."""
    bpy.ops.mesh.primitive_cylinder_add(radius=0.4, depth=height, location=location + mathutils.Vector((0,0,height/2)))
    pillar = bpy.context.object
    pillar.name = name

    mat = bpy.data.materials.get("PillarMat") or bpy.data.materials.new(name="PillarMat")
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.3, 0.3, 0.3, 1)
    pillar.data.materials.append(mat)

    # Add "Inscription" bands
    for i in range(3):
        z_offset = height * (0.2 + i * 0.3)
        bpy.ops.mesh.primitive_torus_add(align='WORLD', location=location + mathutils.Vector((0,0,z_offset)),
                                        major_radius=0.42, minor_radius=0.02)
        band = bpy.context.object
        band.name = f"{name}_Band_{i}"
        band.parent = pillar
        band.matrix_parent_inverse = pillar.matrix_world.inverted()
        band.data.materials.append(mat)

    return pillar

if __name__ == "__main__":
    # Clear scene for testing
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

    create_plant_humanoid("Herbaceous", mathutils.Vector((0, 0, 0)), height_scale=0.8, seed=42)
    create_plant_humanoid("Arbor", mathutils.Vector((2, 0, 0)), height_scale=1.3, vine_thickness=0.07, seed=123)
    create_scroll(mathutils.Vector((1, 0, 0.5)))
    create_flower(mathutils.Vector((0, 0, 2)))

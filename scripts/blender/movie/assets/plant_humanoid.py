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

    # Head (Leafy)
    head_radius = 0.4 * (0.8 + random.random() * 0.4)
    bpy.ops.mesh.primitive_ico_sphere_add(radius=head_radius, location=location + mathutils.Vector((0,0,torso_height + head_radius)))
    head = bpy.context.object
    head.name = f"{name}_Head"

    # Arms (Vines)
    arm_height = torso_height * 0.9
    left_arm = create_vine(location + mathutils.Vector((0.2, 0, arm_height)), location + mathutils.Vector((0.8, 0, arm_height - 0.4)), radius=vine_thickness)
    right_arm = create_vine(location + mathutils.Vector((-0.2, 0, arm_height)), location + mathutils.Vector((-0.8, 0, arm_height - 0.4)), radius=vine_thickness)

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
    mat = bpy.data.materials.new(name=f"PlantMat_{name}")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.1, 0.5, 0.1, 1) # Green

    parts = [head, left_arm, right_arm, left_leg, right_leg]
    for p in parts:
        if p.name not in container.objects:
            container.objects.link(p)

        # Convert to mesh if curve
        if p.type == 'CURVE':
            bpy.ops.object.select_all(action='DESELECT')
            p.select_set(True)
            bpy.context.view_layer.objects.active = p
            bpy.ops.object.convert(target='MESH')

        # Parent to torso
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
            obj.material_slots[0].material = mat
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
    mat = bpy.data.materials.get("BushMat") or bpy.data.materials.new(name="BushMat")
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.05, 0.3, 0.05, 1)

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

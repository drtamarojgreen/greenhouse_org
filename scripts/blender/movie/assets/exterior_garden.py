import bpy
import math
import mathutils
import random
import style

def create_hedge_material():
    mat = bpy.data.materials.get("HedgeMat")
    if mat: return mat

    mat = bpy.data.materials.new(name="HedgeMat")
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()

    node_out = nodes.new(type='ShaderNodeOutputMaterial')
    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')

    # Dark evergreen - different from the bright interior plants
    node_noise = nodes.new(type='ShaderNodeTexNoise')
    node_noise.inputs['Scale'].default_value = 30.0
    node_noise.inputs['Detail'].default_value = 8.0

    node_ramp = nodes.new(type='ShaderNodeValToRGB')
    elements = node_ramp.color_ramp.elements
    elements[0].position = 0.3
    elements[0].color = (0.01, 0.06, 0.02, 1)  # very dark green
    elements[1].position = 0.7
    elements[1].color = (0.05, 0.18, 0.04, 1)  # deep green

    node_bump = nodes.new(type='ShaderNodeBump')
    node_bump.inputs['Strength'].default_value = 0.8

    links.new(node_noise.outputs['Fac'], node_ramp.inputs['Fac'])
    links.new(node_ramp.outputs['Color'], node_bsdf.inputs['Base Color'])
    links.new(node_noise.outputs['Fac'], node_bump.inputs['Height'])
    links.new(node_bump.outputs['Normal'], node_bsdf.inputs['Normal'])

    node_bsdf.inputs['Roughness'].default_value = 0.85

    # Slight subsurface for leaf translucency
    subsurf = ("Subsurface Weight"
               if "Subsurface Weight" in node_bsdf.inputs
               else "Subsurface")
    node_bsdf.inputs[subsurf].default_value = 0.08

    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])
    return mat

def create_soil_material():
    mat = bpy.data.materials.get("SoilMat")
    if mat: return mat

    mat = bpy.data.materials.new(name="SoilMat")
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()

    node_out = nodes.new(type='ShaderNodeOutputMaterial')
    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')

    node_noise = nodes.new(type='ShaderNodeTexNoise')
    node_noise.inputs['Scale'].default_value = 15.0
    node_noise.inputs['Detail'].default_value = 10.0

    node_ramp = nodes.new(type='ShaderNodeValToRGB')
    elements = node_ramp.color_ramp.elements
    elements[0].position = 0.2
    elements[0].color = (0.05, 0.02, 0.01, 1)  # dark wet soil
    elements[1].position = 0.8
    elements[1].color = (0.15, 0.08, 0.04, 1)  # lighter dry soil

    node_disp = nodes.new(type='ShaderNodeDisplacement')
    node_disp.inputs['Scale'].default_value = 0.02

    links.new(node_noise.outputs['Fac'], node_ramp.inputs['Fac'])
    links.new(node_ramp.outputs['Color'], node_bsdf.inputs['Base Color'])
    links.new(node_noise.outputs['Fac'], node_disp.inputs['Height'])
    links.new(node_disp.outputs['Displacement'],
              node_out.inputs['Displacement'])
    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])

    node_bsdf.inputs['Roughness'].default_value = 0.95
    mat.cycles.displacement_method = 'BOTH'
    return mat

def create_hedge_row(start, end, height=2.5, depth=1.2, name="Hedge"):
    """Creates a trimmed hedge between two points."""
    direction = (mathutils.Vector(end) -
                 mathutils.Vector(start))
    length = direction.length
    mid = (mathutils.Vector(start) +
           mathutils.Vector(end)) / 2
    angle = math.atan2(direction.y, direction.x)

    bpy.ops.mesh.primitive_cube_add(location=mid)
    hedge = bpy.context.object
    hedge.name = name
    hedge.scale = (length / 2, depth / 2, height / 2)
    hedge.rotation_euler[2] = angle

    mat = create_hedge_material()
    hedge.data.materials.append(mat)

    # Slightly lumpy top via displace modifier
    bpy.ops.object.modifier_add(type='DISPLACE')
    hedge.modifiers["Displace"].strength = 0.08
    tex = bpy.data.textures.new(f"HedgeBump_{name}", type='CLOUDS')
    tex.noise_scale = 0.3
    hedge.modifiers["Displace"].texture = tex

    return hedge

def create_garden_bed(location, size=(3, 1.5), name="GardenBed"):
    """
    A raised planting bed with soil, edging stones, and
    small flowering plants inside.
    """
    container = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(container)

    soil_mat = create_soil_material()

    # Enhancement #38: Procedural Moss on Stone Surfaces
    import greenhouse_structure
    stone_mat = greenhouse_structure.create_mossy_stone_mat(name=f"StoneMat_{name}")

    # Raised soil bed
    bpy.ops.mesh.primitive_cube_add(
        location=location + mathutils.Vector((0, 0, 0.1))
    )
    soil = bpy.context.object
    soil.name = f"{name}_Soil"
    soil.scale = (size[0]/2, size[1]/2, 0.12)
    soil.data.materials.append(soil_mat)
    container.objects.link(soil)
    bpy.context.scene.collection.objects.unlink(soil)

    # Stone border (4 sides)
    border_specs = [
        # (offset, scale, axis)
        (mathutils.Vector((0,  size[1]/2 + 0.06, 0.08)),
         (size[0]/2 + 0.15, 0.06, 0.1)),
        (mathutils.Vector((0, -size[1]/2 - 0.06, 0.08)),
         (size[0]/2 + 0.15, 0.06, 0.1)),
        (mathutils.Vector(( size[0]/2 + 0.06, 0, 0.08)),
         (0.06, size[1]/2, 0.1)),
        (mathutils.Vector((-size[0]/2 - 0.06, 0, 0.08)),
         (0.06, size[1]/2, 0.1)),
    ]
    for i, (offset, scale) in enumerate(border_specs):
        bpy.ops.mesh.primitive_cube_add(
            location=location + offset
        )
        stone = bpy.context.object
        stone.name = f"{name}_Stone_{i}"
        stone.scale = scale
        stone.data.materials.append(stone_mat)
        container.objects.link(stone)
        bpy.context.scene.collection.objects.unlink(stone)

    # Small plants inside the bed
    import plant_humanoid
    flower_colors = [
        (1, 0.2, 0.4),   # pink
        (1, 0.8, 0.1),   # yellow
        (0.6, 0.2, 0.9), # purple
        (1, 0.4, 0.1),   # orange
    ]
    for i in range(random.randint(3, 6)):
        flower_loc = location + mathutils.Vector((
            random.uniform(-size[0]/2 + 0.3, size[0]/2 - 0.3),
            random.uniform(-size[1]/2 + 0.2, size[1]/2 - 0.2),
            0.22
        ))
        core = plant_humanoid.create_flower(
            flower_loc,
            name=f"{name}_Flower_{i}",
            scale=random.uniform(0.15, 0.35)
        )
        # Override petal color
        color = random.choice(flower_colors)
        mat_name = f"{name}_Flower_{i}_MatPetal"
        petal_mat = bpy.data.materials.get(mat_name)
        if petal_mat:
            bsdf = petal_mat.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                bsdf.inputs['Base Color'].default_value = (*color, 1)

        # Flowering plants are returned in a collection sometimes,
        # but create_flower returns the core object.
        if core.name not in container.objects:
            container.objects.link(core)
        if core.name in bpy.context.scene.collection.objects:
            bpy.context.scene.collection.objects.unlink(core)

    return container

def create_exterior_garden(greenhouse_size=(15, 15, 8)):
    """
    Full exterior garden surrounding the greenhouse:
    - Hedge rows along the perimeter
    - Garden beds with flowers
    - Gravel path leading to entrance
    - Exterior trees
    """
    w, d = greenhouse_size[0], greenhouse_size[1]
    padding = 3.0   # distance from greenhouse wall to first hedge

    # --- Hedge perimeter ---
    # Front hedge row (with gap for path)
    hedge_y = -(d/2 + padding + 1.2)
    create_hedge_row(
        (-w/2 - padding, hedge_y, -1),
        (-2.5, hedge_y, -1),
        height=3.0, depth=1.2,
        name="HedgeFrontLeft"
    )
    create_hedge_row(
        (2.5, hedge_y, -1),
        (w/2 + padding, hedge_y, -1),
        height=3.0, depth=1.2,
        name="HedgeFrontRight"
    )

    # Side hedges
    for side, name in [(-1, "Left"), (1, "Right")]:
        hedge_x = side * (w/2 + padding + 1.2)
        create_hedge_row(
            (hedge_x, -(d/2 + padding), -1),
            (hedge_x,  (d/2 + padding), -1),
            height=3.0, depth=1.2,
            name=f"Hedge{name}"
        )

    # Back hedge
    create_hedge_row(
        (-w/2 - padding, d/2 + padding + 1.2, -1),
        ( w/2 + padding, d/2 + padding + 1.2, -1),
        height=3.0, depth=1.2,
        name="HedgeBack"
    )

    # --- Enhancement #34: Cobblestone Path Material ---
    bpy.ops.mesh.primitive_plane_add(
        size=1,
        location=(0, -(d/2 + padding/2 + 0.6), -0.99)
    )
    path = bpy.context.object
    path.name = "CobblestonePath"
    path.scale = (2.5, (padding + 1.5)/2, 1)

    cobble_mat = bpy.data.materials.new("CobbleMat")
    cobble_mat.use_nodes = True
    nodes = cobble_mat.node_tree.nodes
    links = cobble_mat.node_tree.links
    nodes.clear()
    node_out = nodes.new('ShaderNodeOutputMaterial')
    node_bsdf = nodes.new('ShaderNodeBsdfPrincipled')

    # Voronoi for stones
    node_voronoi = nodes.new('ShaderNodeTexVoronoi')
    node_voronoi.inputs['Scale'].default_value = 20.0

    # Displacement (#34)
    node_disp = nodes.new('ShaderNodeDisplacement')
    node_disp.inputs['Scale'].default_value = 0.05
    links.new(node_voronoi.outputs['Distance'], node_disp.inputs['Height'])
    links.new(node_disp.outputs['Displacement'], node_out.inputs['Displacement'])

    # Color
    node_ramp = nodes.new('ShaderNodeValToRGB')
    node_ramp.color_ramp.elements[0].color = (0.2, 0.2, 0.2, 1)
    node_ramp.color_ramp.elements[1].color = (0.4, 0.4, 0.4, 1)
    links.new(node_voronoi.outputs['Color'], node_ramp.inputs['Fac'])
    links.new(node_ramp.outputs['Color'], node_bsdf.inputs['Base Color'])

    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])
    node_bsdf.inputs['Roughness'].default_value = 0.8
    cobble_mat.cycles.displacement_method = 'BOTH'
    path.data.materials.append(cobble_mat)

    # --- Garden beds along front ---
    bed_positions = [
        mathutils.Vector((-6, -(d/2 + 1.5), -1)),
        mathutils.Vector((-3, -(d/2 + 1.5), -1)),
        mathutils.Vector(( 3, -(d/2 + 1.5), -1)),
        mathutils.Vector(( 6, -(d/2 + 1.5), -1)),
    ]
    beds = []
    for i, pos in enumerate(bed_positions):
        bed = create_garden_bed(
            pos,
            size=(2.5, 1.2),
            name=f"ExteriorBed_{i}"
        )
        beds.append(bed)

    # --- Enhancement #32: Koi Pond in Garden Exterior ---
    def create_koi_pond(location, size=(4, 6)):
        bpy.ops.mesh.primitive_plane_add(size=1, location=location)
        pond = bpy.context.object
        pond.name = "KoiPond"
        pond.scale = (size[0]/2, size[1]/2, 1)

        mat = bpy.data.materials.new("PondMat")
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        bsdf.inputs['Base Color'].default_value = (0.05, 0.1, 0.2, 1)
        style.set_principled_socket(bsdf, 'Transmission', 0.8)
        bsdf.inputs['Roughness'].default_value = 0.01

        # Ripple normal
        node_noise = mat.node_tree.nodes.new('ShaderNodeTexNoise')
        node_noise.inputs['Scale'].default_value = 50.0
        node_bump = mat.node_tree.nodes.new('ShaderNodeBump')
        node_bump.inputs['Strength'].default_value = 0.1
        mat.node_tree.links.new(node_noise.outputs['Fac'], node_bump.inputs['Height'])
        mat.node_tree.links.new(node_bump.outputs['Normal'], bsdf.inputs['Normal'])

        # Animate ripples (#32)
        node_noise.inputs['W'].default_value = 0
        node_noise.inputs['W'].keyframe_insert(data_path="default_value", frame=1)
        node_noise.inputs['W'].default_value = 5.0
        node_noise.inputs['W'].keyframe_insert(data_path="default_value", frame=15000)

        pond.data.materials.append(mat)
        style.set_blend_method(mat, 'BLEND')

        # Add simple fish objects (#32)
        for i in range(5):
            bpy.ops.mesh.primitive_cone_add(radius1=0.05, depth=0.2, location=location + mathutils.Vector((random.uniform(-1, 1), random.uniform(-2, 2), -0.1)))
            fish = bpy.context.object
            fish.name = f"Koi_{i}"
            fish.rotation_euler[0] = math.radians(90)
            fish.data.materials.append(bpy.data.materials.new(f"FishMat_{i}"))
            fish.data.materials[0].node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (1, 0.4, 0, 1) # Orange

            # Animate fish paths
            style.insert_looping_noise(fish, "location", strength=1.0, scale=100.0)

    create_koi_pond(location=(w/2 + 5, 0, -1.01))

    # --- Exterior grass ground plane ---
    bpy.ops.mesh.primitive_plane_add(
        size=200,
        location=(0, 0, -1.02)
    )
    ground = bpy.context.object
    ground.name = "ExteriorGround"

    grass_mat = bpy.data.materials.new("GrassMat")
    grass_mat.use_nodes = True
    nodes = grass_mat.node_tree.nodes
    links = grass_mat.node_tree.links
    nodes.clear()
    node_out = nodes.new('ShaderNodeOutputMaterial')
    node_bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    node_noise = nodes.new('ShaderNodeTexNoise')
    node_noise.inputs['Scale'].default_value = 40.0
    node_noise.inputs['Detail'].default_value = 12.0
    node_ramp = nodes.new('ShaderNodeValToRGB')
    elements = node_ramp.color_ramp.elements
    elements[0].position = 0.3
    elements[0].color = (0.02, 0.09, 0.01, 1)
    elements[1].position = 0.7
    elements[1].color = (0.06, 0.20, 0.03, 1)
    links.new(node_noise.outputs['Fac'], node_ramp.inputs['Fac'])
    links.new(node_ramp.outputs['Color'], node_bsdf.inputs['Base Color'])
    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])
    node_bsdf.inputs['Roughness'].default_value = 0.95
    ground.data.materials.append(grass_mat)

    return beds

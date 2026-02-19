import bpy
import math
import mathutils
import random
import style

def create_terracotta_material():
    mat = bpy.data.materials.get("TerracottaMat")
    if mat: return mat
    mat = bpy.data.materials.new(name="TerracottaMat")
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()
    node_out = nodes.new('ShaderNodeOutputMaterial')
    node_bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    node_noise = nodes.new('ShaderNodeTexNoise')
    node_noise.inputs['Scale'].default_value = 20.0
    node_ramp = nodes.new('ShaderNodeValToRGB')
    elements = node_ramp.color_ramp.elements
    elements[0].color = (0.35, 0.12, 0.05, 1)  # dark terracotta
    elements[1].color = (0.65, 0.28, 0.12, 1)  # light terracotta
    node_bump = nodes.new('ShaderNodeBump')
    node_bump.inputs['Strength'].default_value = 0.3
    links.new(node_noise.outputs['Fac'], node_ramp.inputs['Fac'])
    links.new(node_ramp.outputs['Color'], node_bsdf.inputs['Base Color'])
    links.new(node_noise.outputs['Fac'], node_bump.inputs['Height'])
    links.new(node_bump.outputs['Normal'], node_bsdf.inputs['Normal'])
    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])
    node_bsdf.inputs['Roughness'].default_value = 0.85
    return mat

def create_plant_pot(location, radius=0.15, height=0.2, name="Pot"):
    location = mathutils.Vector(location)
    """A terracotta plant pot with tapered sides."""
    # Blender cone with top and bottom radii creates tapered pot shape
    bpy.ops.mesh.primitive_cone_add(
        vertices=16,
        radius1=radius,           # base (bottom, narrower)
        radius2=radius * 1.3,     # top (wider opening)
        depth=height,
        location=location + mathutils.Vector((0, 0, height/2))
    )
    pot = bpy.context.object
    pot.name = name
    pot.data.materials.append(create_terracotta_material())

    # Soil disc on top
    bpy.ops.mesh.primitive_cylinder_add(
        radius=radius * 1.25,
        depth=0.02,
        location=location + mathutils.Vector((0, 0, height + 0.01))
    )
    soil_top = bpy.context.object
    soil_top.name = f"{name}_Soil"

    import exterior_garden
    soil_top.data.materials.append(exterior_garden.create_soil_material())
    soil_top.parent = pot
    soil_top.matrix_parent_inverse = pot.matrix_world.inverted()

    return pot

def create_potted_plant(location, plant_type='FERN', name="PottedPlant"):
    """Point 95: BMesh Potted Plant creation."""
    import bmesh
    from assets import plant_humanoid
    
    mesh_data = bpy.data.meshes.new(f"{name}_MeshData")
    obj = bpy.data.objects.new(name, mesh_data)
    bpy.context.collection.objects.link(obj)
    obj.location = location

    bm = bmesh.new()
    pot_h = random.uniform(0.15, 0.25)
    rad = random.uniform(0.1, 0.18)
    
    # Pot
    bmesh.ops.create_cone(bm, segments=16, cap_ends=True, radius1=rad, radius2=rad*1.3, depth=pot_h, matrix=mathutils.Matrix.Translation((0,0,pot_h/2)))
    for f in bm.faces: f.material_index = 0 # terracotta

    # Soil
    ret = bmesh.ops.create_cylinder(bm, segments=16, radius=rad*1.25, depth=0.02, matrix=mathutils.Matrix.Translation((0,0,pot_h + 0.01)))
    for f in ret['faces']: f.material_index = 1 # soil

    # Plant
    plant_top = mathutils.Vector((0, 0, pot_h + 0.02))
    if plant_type == 'FERN':
        for i in range(random.randint(5, 9)):
            angle = (i / 7) * math.pi * 2
            end = plant_top + mathutils.Vector((math.cos(angle)*0.25, math.sin(angle)*0.25, 0.1))
            _bmesh_vine(bm, plant_top, end, radius=0.008, mat_idx=2)
    elif plant_type == 'SUCCULENT':
        ret = bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=8, radius=0.04, matrix=mathutils.Matrix.Translation(plant_top + mathutils.Vector((0,0,0.05))))
        for f in ret['faces']: f.material_index = 2
        for i in range(8):
            angle = (i / 8) * math.pi * 2
            r = 0.06 + (i % 3) * 0.02
            loc = plant_top + mathutils.Vector((math.cos(angle)*r, math.sin(angle)*r, 0.02))
            matrix = mathutils.Matrix.Translation(loc) @ mathutils.Euler((math.radians(30), 0, angle)).to_matrix().to_4x4()
            ret = bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=8, radius=0.025, matrix=matrix)
            for f in ret['faces']: f.material_index = 2
    elif plant_type == 'VINE':
        for i in range(4):
            angle = (i / 4) * math.pi * 2
            end = plant_top + mathutils.Vector((math.cos(angle)*0.4, math.sin(angle)*0.4, -0.3))
            _bmesh_vine(bm, plant_top, end, radius=0.006, mat_idx=2)

    bm.to_mesh(mesh_data)
    bm.free()

    obj.data.materials.append(create_terracotta_material())
    import exterior_garden
    obj.data.materials.append(exterior_garden.create_soil_material())
    obj.data.materials.append(plant_humanoid.create_leaf_material(f"{name}_LeafMat", color=(0.1, 0.4, 0.1)))

    return obj

def _bmesh_vine(bm, start, end, radius, mat_idx):
    """Internal helper to add a vine to a BMesh."""
    import bmesh
    direction = end - start
    length = direction.length
    center = (start + end) / 2
    rot = direction.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
    matrix = mathutils.Matrix.Translation(center) @ rot
    ret = bmesh.ops.create_cylinder(bm, segments=8, radius=radius, depth=length, matrix=matrix)
    for f in ret['faces']: f.material_index = mat_idx

def create_potting_bench(location, name="PottingBench"):
    """Point 95: BMesh Potting Bench creation."""
    import bmesh
    import library_props

    mesh_data = bpy.data.meshes.new(f"{name}_MeshData")
    obj = bpy.data.objects.new(name, mesh_data)
    bpy.context.collection.objects.link(obj)
    obj.location = location

    bm = bmesh.new()
    table_h, table_w, table_d = 1.0, 2.4, 0.8

    # Slats
    slat_count = 8
    slat_gap = table_w / slat_count
    for i in range(slat_count):
        x = -table_w/2 + slat_gap * (i + 0.5)
        matrix = mathutils.Matrix.Translation((x, 0, table_h))
        ret = bmesh.ops.create_cube(bm, size=1.0, matrix=matrix)
        for v in ret['verts']:
            v.co.x *= (slat_gap - 0.02)
            v.co.y *= table_d
            v.co.z *= 0.05
        for f in ret['faces']: f.material_index = 0 # wood

    # Legs
    leg_pos = [(-table_w/2 + 0.05, table_d/2 - 0.05), (table_w/2 - 0.05, table_d/2 - 0.05),
               (-table_w/2 + 0.05, -table_d/2 + 0.05), (table_w/2 - 0.05, -table_d/2 + 0.05)]
    for lx, ly in leg_pos:
        matrix = mathutils.Matrix.Translation((lx, ly, table_h/2))
        ret = bmesh.ops.create_cylinder(bm, segments=8, radius=0.025, depth=table_h, matrix=matrix)
        for f in ret['faces']: f.material_index = 1 # iron

    # Lower shelf
    matrix_shelf = mathutils.Matrix.Translation((0, 0, table_h * 0.35))
    ret = bmesh.ops.create_cube(bm, size=1.0, matrix=matrix_shelf)
    for v in ret['verts']:
        v.co.x *= (table_w - 0.1)
        v.co.y *= (table_d - 0.1)
        v.co.z *= 0.03
    for f in ret['faces']: f.material_index = 0

    bm.to_mesh(mesh_data)
    bm.free()

    wood_mat = library_props.create_wood_material(f"{name}_WoodMat", color=(0.25, 0.12, 0.05))
    iron_mat = bpy.data.materials.get("GH_Iron") or bpy.data.materials.new("GH_Iron")
    obj.data.materials.append(wood_mat)
    obj.data.materials.append(iron_mat)

    # Add plants as children (keeping them separate for variety if needed, but they are single objects now)
    plant_types = ['FERN', 'SUCCULENT', 'VINE', 'SUCCULENT', 'FERN']
    pot_positions = [(-0.8, -0.15, table_h + 0.02), (-0.3, 0.1, table_h + 0.02),
                     (0.15, -0.05, table_h + 0.02), (0.6, 0.1, table_h + 0.02), (0.9, -0.15, table_h + 0.02)]

    for i, (pos, ptype) in enumerate(zip(pot_positions, plant_types)):
        p_obj = create_potted_plant(location + mathutils.Vector(pos), plant_type=ptype, name=f"{name}_Plant_{i}")
        p_obj.parent = obj
        
    return obj

def create_hanging_basket(location, name="HangingBasket"):
    """Point 95: BMesh Hanging Basket."""
    import bmesh
    from assets import plant_humanoid
    
    mesh_data = bpy.data.meshes.new(f"{name}_MeshData")
    obj = bpy.data.objects.new(name, mesh_data)
    bpy.context.collection.objects.link(obj)
    obj.location = location

    bm = bmesh.new()
    # Basket frame (Ico sphere wireframe simulation in BMesh)
    ret = bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.2)
    # To simulate wireframe in BMesh, we could do more, but for simplicity we'll just use the mesh
    for f in bm.faces: f.material_index = 0
    
    # Trailing vines
    for i in range(6):
        angle = (i / 6) * math.pi * 2
        start = mathutils.Vector((math.cos(angle)*0.15, math.sin(angle)*0.15, -0.2))
        end = start + mathutils.Vector((math.cos(angle)*0.1, math.sin(angle)*0.1, -random.uniform(0.4, 0.8)))
        _bmesh_vine(bm, start, end, radius=0.005, mat_idx=1)

    bm.to_mesh(mesh_data)
    bm.free()

    iron_mat = bpy.data.materials.get("GH_Iron") or bpy.data.materials.new("GH_Iron")
    leaf_mat = plant_humanoid.create_leaf_material(f"{name}_LeafMat", color=(0.04, 0.25, 0.06))
    obj.data.materials.append(iron_mat)
    obj.data.materials.append(leaf_mat)

    return obj

def setup_greenhouse_interior(greenhouse_size=(15, 15, 8)):
    """
    Populates the greenhouse interior with:
    - Potting benches along the walls
    - A central display table
    - Hanging baskets from the roof beams
    - Standalone large specimen plants
    """
    w, d, h = greenhouse_size

    # --- Potting benches along side walls ---
    bench_positions = [
        # Left wall benches
        mathutils.Vector((-w/2 + 1.5, -3, -1)),
        mathutils.Vector((-w/2 + 1.5,  3, -1)),
        # Right wall benches
        mathutils.Vector(( w/2 - 1.5, -3, -1)),
        mathutils.Vector(( w/2 - 1.5,  3, -1)),
        # Back wall bench
        mathutils.Vector((0, d/2 - 1.5, -1)),
    ]
    benches = []
    for i, pos in enumerate(bench_positions):
        bench = create_potting_bench(
            pos,
            name=f"PottingBench_{i}"
        )
        if bench: benches.append(bench)

    # --- Central display island ---
    # Merge island parts? 
    # Island is simple: 1 table + 4 plants.
    # Let's join them for consistency.
    island_parts = []
    
    bpy.ops.mesh.primitive_cube_add(
        location=(0, 0, -0.6)
    )
    island = bpy.context.object
    island.name = "DisplayIsland_Base"
    island.scale = (2.5, 1.0, 0.4)

    import library_props
    island.data.materials.append(
        library_props.create_wood_material(
            "IslandMat", color=(0.2, 0.1, 0.04)
        )
    )
    island_parts.append(island)

    # Specimen plants on the island
    island_plant_locs = [
        mathutils.Vector((-1.5, 0, 0.2)),
        mathutils.Vector((-0.5, 0.3, 0.2)),
        mathutils.Vector(( 0.5, -0.2, 0.2)),
        mathutils.Vector(( 1.5, 0.1, 0.2)),
    ]
    for i, loc in enumerate(island_plant_locs):
        p_obj = create_potted_plant(
            loc,
            plant_type=random.choice(
                ['FERN', 'SUCCULENT',
                 'FLOWERING', 'VINE']
            ),
            name=f"IslandPlant_{i}"
        )
        if p_obj: island_parts.append(p_obj)
        
    # Join Island
    if island_parts:
        bpy.ops.object.select_all(action='DESELECT')
        for p in island_parts: p.select_set(True)
        bpy.context.view_layer.objects.active = island_parts[0]
        bpy.ops.object.join()
        island_main = bpy.context.active_object
        island_main.name = "DisplayIsland_Main"


    # --- Hanging baskets from roof ---
    basket_locs = [
        mathutils.Vector((-4, -4, h - 1)),
        mathutils.Vector(( 4, -4, h - 1)),
        mathutils.Vector((-4,  4, h - 1)),
        mathutils.Vector(( 4,  4, h - 1)),
        mathutils.Vector(( 0,  0, h - 0.5)),  # center
    ]
    for i, loc in enumerate(basket_locs):
        basket = create_hanging_basket(
            loc,
            name=f"HangingBasket_{i}"
        )

        # Hanging wire from beam to basket
        # Join wire to basket?
        if basket:
            beam_attach = loc + mathutils.Vector((0, 0, 0.5))
            from assets import plant_humanoid
            wire = plant_humanoid.create_vine(
                beam_attach, loc,
                radius=0.004
            )
            wire.name = f"BasketWire_{i}"
            iron_mat = bpy.data.materials.get("GH_Iron")
            if iron_mat:
                wire.data.materials.append(iron_mat)
            
            # Join wire to basket
            bpy.ops.object.select_all(action='DESELECT')
            wire.select_set(True)
            basket.select_set(True)
            bpy.context.view_layer.objects.active = basket
            bpy.ops.object.join()

    return benches

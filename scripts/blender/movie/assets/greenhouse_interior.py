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
    location = mathutils.Vector(location)
    """
    Creates a pot with a small plant inside.
    Returns a single merged mesh object.
    """
    # Create a temporary collection to hold parts before joining
    temp_col = bpy.data.collections.new(f"{name}_Temp")
    bpy.context.scene.collection.children.link(temp_col)
    
    parts = []

    pot_height = random.uniform(0.15, 0.25)
    # Re-implement pot creation inline or modify create_plant_pot to return objects
    # For simplicity, inline the pot creation here to avoid parenting issues before join
    
    # Pot
    radius = random.uniform(0.1, 0.18)
    bpy.ops.mesh.primitive_cone_add(
        vertices=16,
        radius1=radius,
        radius2=radius * 1.3,
        depth=pot_height,
        location=location + mathutils.Vector((0, 0, pot_height/2))
    )
    pot = bpy.context.object
    pot.name = f"{name}_Pot"
    pot.data.materials.append(create_terracotta_material())
    parts.append(pot)

    # Soil disc
    bpy.ops.mesh.primitive_cylinder_add(
        radius=radius * 1.25,
        depth=0.02,
        location=location + mathutils.Vector((0, 0, pot_height + 0.01))
    )
    soil = bpy.context.object
    soil.name = f"{name}_Soil"
    import exterior_garden
    soil.data.materials.append(exterior_garden.create_soil_material())
    parts.append(soil)

    plant_top = location + mathutils.Vector((0, 0, pot_height + 0.02))

    # Generate plant parts
    if plant_type == 'FERN':
        _create_fern(plant_top, name, parts)
    elif plant_type == 'SUCCULENT':
        _create_succulent(plant_top, name, parts)
    elif plant_type == 'VINE':
        _create_hanging_vine(plant_top, name, parts)
    elif plant_type == 'FLOWERING':
        from assets import plant_humanoid
        core = plant_humanoid.create_flower(
            plant_top,
            name=f"{name}_Flower",
            scale=random.uniform(0.2, 0.4)
        )
        parts.append(core)

    # Join all parts
    if parts:
        bpy.ops.object.select_all(action='DESELECT')
        for p in parts:
            # Ensure in temp col for selection? select_set works globally if in scene
            # They are in active context from primitive_add/create functions
            p.select_set(True)
        
        bpy.context.view_layer.objects.active = parts[0]
        bpy.ops.object.join()
        combined = bpy.context.active_object
        combined.name = name
        
        # Cleanup temp collection if needed (parts are now one object)
        # Ensure the combined object is linked to the scene collection or intended destination
        # It's currently in whatever collection parts[0] was in.
    else:
        combined = None

    bpy.data.collections.remove(temp_col)
    return combined

def _create_fern(location, name, parts_list):
    """Small fern with radiating fronds."""
    from assets import plant_humanoid
    mat = plant_humanoid.create_leaf_material(
        f"{name}_FernMat",
        color=(0.08, 0.35, 0.06),
        quality='hero'
    )
    for i in range(random.randint(5, 9)):
        angle = (i / 7) * math.pi * 2
        frond_end = location + mathutils.Vector((
            math.cos(angle) * 0.25,
            math.sin(angle) * 0.25,
            0.1
        ))
        frond = plant_humanoid.create_vine(location, frond_end, radius=0.008)
        frond.name = f"{name}_Frond_{i}"
        frond.data.materials.append(mat)
        parts_list.append(frond)

def _create_succulent(location, name, parts_list):
    """Rosette succulent from ico spheres."""
    mat = bpy.data.materials.new(f"{name}_SucculentMat")
    # mat.use_nodes = True # Deprecated
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs['Base Color'].default_value = (0.15, 0.45, 0.25, 1)
    bsdf.inputs['Roughness'].default_value = 0.3

    # Center bud
    bpy.ops.mesh.primitive_ico_sphere_add(
        radius=0.04,
        location=location + mathutils.Vector((0, 0, 0.05))
    )
    center = bpy.context.object
    center.name = f"{name}_Center"
    center.data.materials.append(mat)
    parts_list.append(center)

    # Radiating leaves
    for i in range(8):
        angle = (i / 8) * math.pi * 2
        r = 0.06 + (i % 3) * 0.02
        leaf_loc = location + mathutils.Vector((
            math.cos(angle) * r,
            math.sin(angle) * r,
            0.02
        ))
        bpy.ops.mesh.primitive_ico_sphere_add(
            radius=0.025,
            location=leaf_loc
        )
        leaf = bpy.context.object
        leaf.name = f"{name}_Leaf_{i}"
        leaf.scale = (1.5, 0.8, 0.5)
        leaf.rotation_euler[2] = angle
        leaf.rotation_euler[0] = math.radians(30)
        leaf.data.materials.append(mat)
        parts_list.append(leaf)

def _create_hanging_vine(location, name, parts_list):
    """Trailing vine that hangs over pot edge."""
    from assets import plant_humanoid
    mat = plant_humanoid.create_leaf_material(
        f"{name}_VineMat",
        color=(0.05, 0.28, 0.08)
    )
    for i in range(4):
        angle = (i / 4) * math.pi * 2
        end = location + mathutils.Vector((
            math.cos(angle) * 0.4,
            math.sin(angle) * 0.4,
            -0.3  # hangs down below pot rim
        ))
        vine = plant_humanoid.create_vine(location, end, radius=0.006)
        vine.name = f"{name}_Vine_{i}"
        vine.data.materials.append(mat)
        parts_list.append(vine)

def create_potting_bench(location, name="PottingBench"):
    """
    A proper wooden potting table with:
    - Slatted wooden top
    - Lower shelf for tools/pots
    - Iron pipe legs (matching greenhouse aesthetic)
    Returns a SINGLE joined mesh object.
    """
    # Temp collection for organization (optional, but keep for safety)
    # Actually, let's just create parts and join them.
    
    parts = []

    import library_props
    iron_mat = bpy.data.materials.get("GH_Iron") or \
               bpy.data.materials.new("GH_Iron")
    wood_mat = library_props.create_wood_material(
        f"{name}_WoodMat",
        color=(0.25, 0.12, 0.05)
    )

    table_h = 1.0
    table_w = 2.4
    table_d = 0.8

    # --- Tabletop slats ---
    slat_count = 8
    slat_gap = table_w / slat_count
    for i in range(slat_count):
        x = location.x - table_w/2 + slat_gap * (i + 0.5)
        bpy.ops.mesh.primitive_cube_add(
            location=(x,
                      location.y,
                      location.z + table_h)
        )
        slat = bpy.context.object
        slat.name = f"{name}_Slat_{i}"
        slat.scale = (
            slat_gap/2 - 0.01,
            table_d/2,
            0.025
        )
        slat.data.materials.append(wood_mat)
        parts.append(slat)

    # --- Iron pipe legs (4 corners) ---
    leg_positions = [
        (-table_w/2 + 0.05,  table_d/2 - 0.05),
        ( table_w/2 - 0.05,  table_d/2 - 0.05),
        (-table_w/2 + 0.05, -table_d/2 + 0.05),
        ( table_w/2 - 0.05, -table_d/2 + 0.05),
    ]
    for i, (lx, ly) in enumerate(leg_positions):
        bpy.ops.mesh.primitive_cylinder_add(
            radius=0.025,
            depth=table_h,
            location=(location.x + lx,
                      location.y + ly,
                      location.z + table_h/2)
        )
        leg = bpy.context.object
        leg.name = f"{name}_Leg_{i}"
        leg.data.materials.append(iron_mat)
        parts.append(leg)

    # --- Lower shelf ---
    bpy.ops.mesh.primitive_cube_add(
        location=(location.x,
                  location.y,
                  location.z + table_h * 0.35)
    )
    shelf = bpy.context.object
    shelf.name = f"{name}_Shelf"
    shelf.scale = (table_w/2 - 0.05, table_d/2 - 0.05, 0.015)
    shelf.data.materials.append(wood_mat)
    parts.append(shelf)

    # --- Pots on the table ---
    plant_types = ['FERN', 'SUCCULENT', 'FLOWERING',
                   'VINE', 'SUCCULENT', 'FERN']
    pot_positions = [
        mathutils.Vector((location.x - 0.8,
                          location.y - 0.15,
                          location.z + table_h + 0.02)),
        mathutils.Vector((location.x - 0.3,
                          location.y + 0.1,
                          location.z + table_h + 0.02)),
        mathutils.Vector((location.x + 0.15,
                          location.y - 0.05,
                          location.z + table_h + 0.02)),
        mathutils.Vector((location.x + 0.6,
                          location.y + 0.1,
                          location.z + table_h + 0.02)),
        mathutils.Vector((location.x + 0.9,
                          location.y - 0.15,
                          location.z + table_h + 0.02)),
    ]
    for i, (pos, ptype) in enumerate(
            zip(pot_positions, plant_types)):
        # create_potted_plant now returns a SINGLE OBJECT (or None)
        plant_obj = create_potted_plant(
            pos,
            plant_type=ptype,
            name=f"{name}_Plant_{i}"
        )
        if plant_obj:
            parts.append(plant_obj)

    # --- Lower shelf storage (extra pots, stacked) ---
    for i in range(3):
        # We need to adapt create_plant_pot to return the object too, or just make it inline or use potted_plant result
        # create_plant_pot currently returns 'pot' object but creates 'soil' parented to it.
        # This will fail join if we don't include children or if we don't apply parenting.
        # Optimization: Just create empty pots here as single meshes.
        
        # Inline simplified empty pot creation suited for joining
        radius = 0.12
        height = 0.15
        loc = mathutils.Vector((
            location.x - 0.6 + i * 0.4,
            location.y,
            location.z + table_h * 0.35 + 0.015
        ))
        
        bpy.ops.mesh.primitive_cone_add(
            vertices=16,
            radius1=radius, radius2=radius*1.3, depth=height,
            location=loc + mathutils.Vector((0,0,height/2))
        )
        pot = bpy.context.object
        pot.name = f"{name}_StoragePot_{i}"
        pot.data.materials.append(create_terracotta_material())
        parts.append(pot)

    # JOIN EVERYTHING
    if parts:
        bpy.ops.object.select_all(action='DESELECT')
        for p in parts:
            p.select_set(True)
        bpy.context.view_layer.objects.active = parts[0]
        bpy.ops.object.join()
        bench_main = bpy.context.active_object
        bench_main.name = name
        
        # Link to collection (assuming caller handles it or we link to scene col)
        # Note: primitive_add links to scene collection by default.
        # But create_potted_plant might have done its own thing? 
        # create_potted_plant removes temp col but links combined object? No, lines say "It's currently in whatever collection parts[0] was in".
        # So it's safer to ensure linkage.
        if bench_main.name not in bpy.context.scene.collection.objects:
             bpy.context.scene.collection.objects.link(bench_main)
             
        return bench_main
    return None

def create_hanging_basket(location, name="HangingBasket"):
    """Hanging wire basket with trailing plants from greenhouse roof. Returns single mesh."""
    parts = []
    
    # Wire frame basket
    basket_mat = bpy.data.materials.get("GH_Iron")

    bpy.ops.mesh.primitive_ico_sphere_add(
        radius=0.2,
        location=location
    )
    basket = bpy.context.object
    basket.name = f"{name}_Frame"
    # Make it look like open wire by using wireframe modifier
    wire_mod = basket.modifiers.new(name="Wire", type='WIREFRAME')
    wire_mod.thickness = 0.008
    # We must apply modifier to join
    bpy.ops.object.modifier_apply(modifier="Wire")
    
    if basket_mat:
        basket.data.materials.append(basket_mat)
    parts.append(basket)

    # Trailing vines hanging down
    from assets import plant_humanoid
    mat = plant_humanoid.create_leaf_material(
        f"{name}_TrailMat",
        color=(0.04, 0.25, 0.06)
    )
    for i in range(6):
        angle = (i / 6) * math.pi * 2
        start = location + mathutils.Vector((
            math.cos(angle) * 0.15,
            math.sin(angle) * 0.15,
            -0.2
        ))
        end = start + mathutils.Vector((
            math.cos(angle) * 0.1,
            math.sin(angle) * 0.1,
            -random.uniform(0.4, 0.8)
        ))
        vine = plant_humanoid.create_vine(start, end, radius=0.005)
        vine.name = f"{name}_Trail_{i}"
        vine.data.materials.append(mat)
        parts.append(vine)

    # JOIN
    if parts:
        bpy.ops.object.select_all(action='DESELECT')
        for p in parts: p.select_set(True)
        bpy.context.view_layer.objects.active = parts[0]
        bpy.ops.object.join()
        basket_main = bpy.context.active_object
        basket_main.name = name
        return basket_main
    return None

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

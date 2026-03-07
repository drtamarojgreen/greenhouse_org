import bpy
import math
import bmesh
import mathutils
import random
import style_utilities as style

# Memory Optimization: Master Collections for Instancing
_MASTER_COLLECTION_NAME = "Master_Assets"
_plant_cache = {}

def get_master_collection():
    """Retrieves or creates the hidden master collection for assets."""
    master = bpy.data.collections.get(_MASTER_COLLECTION_NAME)
    if not master:
        master = bpy.data.collections.new(_MASTER_COLLECTION_NAME)
        # We don't link it to the scene collection to keep it hidden, 
        # but in Blender 4.x/5.x we often need to link it somewhere to keep it alive
        # or just use the bpy.data.collections reference.
        # For instancing to work reliably, it's often best to link it but hide it.
        if master.name not in bpy.context.scene.collection.children:
            bpy.context.scene.collection.children.link(master)
        master.hide_viewport = True
        master.hide_render = True
    return master

def create_terracotta_material():
    """Point 79: Showcase-inspired aged terracotta material."""
    mat = bpy.data.materials.get("TerracottaMat") or bpy.data.materials.new(name="TerracottaMat")
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()

    node_out = nodes.new('ShaderNodeOutputMaterial')
    node_bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])

    node_coord = nodes.new('ShaderNodeTexCoord')
    node_mapping = nodes.new('ShaderNodeMapping')
    node_mapping.inputs['Scale'].default_value = (3, 3, 3)
    links.new(node_coord.outputs['UV'], node_mapping.inputs['Vector'])

    # Aged clay look: two-layer noise
    node_noise1 = nodes.new('ShaderNodeTexNoise')
    node_noise1.inputs['Scale'].default_value = 6.0
    node_noise1.inputs['Detail'].default_value = 10.0
    node_noise1.inputs['Roughness'].default_value = 0.65

    node_noise2 = nodes.new('ShaderNodeTexNoise')
    node_noise2.inputs['Scale'].default_value = 18.0
    node_noise2.inputs['Detail'].default_value = 4.0
    node_noise2.inputs['Roughness'].default_value = 0.8

    node_mix_noise = style.create_mix_node(mat.node_tree, blend_type='MIX', data_type='RGBA')
    fac_sock, in1_sock, in2_sock = style.get_mix_sockets(node_mix_noise)
    if fac_sock: fac_sock.default_value = 0.35

    links.new(node_mapping.outputs['Vector'], node_noise1.inputs['Vector'])
    links.new(node_mapping.outputs['Vector'], node_noise2.inputs['Vector'])

    node_ramp1 = nodes.new('ShaderNodeValToRGB')
    elements1 = node_ramp1.color_ramp.elements
    while len(elements1) < 3: elements1.new(0.5)
    elements1[0].position, elements1[0].color = 0.0, (0.65, 0.32, 0.20, 1.0)
    elements1[1].position, elements1[1].color = 0.4, (0.78, 0.40, 0.24, 1.0)
    elements1[2].position, elements1[2].color = 1.0, (0.48, 0.24, 0.16, 1.0)
    links.new(node_noise1.outputs['Fac'], node_ramp1.inputs['Fac'])

    node_ramp2 = nodes.new('ShaderNodeValToRGB')
    elements2 = node_ramp2.color_ramp.elements
    elements2[0].position, elements2[0].color = 0.0, (0.52, 0.26, 0.17, 1.0)
    elements2[1].position, elements2[1].color = 1.0, (0.82, 0.45, 0.28, 1.0)
    links.new(node_noise2.outputs['Fac'], node_ramp2.inputs['Fac'])

    links.new(node_ramp1.outputs['Color'], in1_sock)
    links.new(node_ramp2.outputs['Color'], in2_sock)
    links.new(style.get_mix_output(node_mix_noise), node_bsdf.inputs['Base Color'])

    # Normal Bump - Port 72: Combined Normals/Bump (Bark-like complexity)
    node_bump1 = nodes.new('ShaderNodeBump')
    node_bump1.inputs['Strength'].default_value = 0.3
    node_bump1.inputs['Distance'].default_value = 0.004
    links.new(node_noise2.outputs['Fac'], node_bump1.inputs['Height'])

    node_bump2 = nodes.new('ShaderNodeBump')
    node_bump2.inputs['Strength'].default_value = 0.6
    node_bump2.inputs['Distance'].default_value = 0.010
    links.new(node_noise1.outputs['Fac'], node_bump2.inputs['Height'])
    links.new(node_bump1.outputs['Normal'], node_bump2.inputs['Normal'])
    links.new(node_bump2.outputs['Normal'], node_bsdf.inputs['Normal'])

    node_bsdf.inputs['Roughness'].default_value = 0.88
    if node_bsdf.inputs.get("Specular IOR Level"):
        node_bsdf.inputs["Specular IOR Level"].default_value = 0.04
    return mat

def _bmesh_vine(bm, start, end, radius, mat_idx):
    segment_vec = end - start; rot = segment_vec.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
    # DEPTH is the length of the cylinder. BMesh create_cone depth is the total height.
    ret = bmesh.ops.create_cone(bm, segments=8, cap_ends=True, radius1=radius, radius2=radius, depth=segment_vec.length, matrix=mathutils.Matrix.Translation((start + end) / 2) @ rot)
    for f in {f for v in ret['verts'] for f in v.link_faces}: f.material_index = mat_idx

def get_potted_plant_master(plant_type='FERN'):
    """Creates a master potted plant collection for instancing."""
    cache_key = f"Potted_{plant_type}"
    if cache_key in _plant_cache:
        return _plant_cache[cache_key]

    from assets import plant_humanoid
    master_col = get_master_collection()
    
    # Create a sub-collection for this specific plant type instance
    sub_col = bpy.data.collections.new(f"Col_{cache_key}")
    master_col.children.link(sub_col)
    
    mesh_data = bpy.data.meshes.new(f"Mesh_{cache_key}")
    obj = bpy.data.objects.new(f"Master_{cache_key}", mesh_data)
    sub_col.objects.link(obj)
    
    bm = bmesh.new(); pot_h, rad = 0.2, 0.15
    # Pot body
    bmesh.ops.create_cone(bm, segments=16, cap_ends=True, radius1=rad, radius2=rad*1.3, depth=pot_h, matrix=mathutils.Matrix.Translation((0,0,pot_h/2)))
    for f in bm.faces: f.material_index = 0
    # Pot rim
    ret = bmesh.ops.create_cone(bm, segments=16, cap_ends=True, radius1=rad*1.25, radius2=rad*1.25, depth=0.02, matrix=mathutils.Matrix.Translation((0,0,pot_h + 0.01)))
    for f in {f for v in ret['verts'] for f in v.link_faces}: f.material_index = 1
    
    plant_top = mathutils.Vector((0, 0, pot_h + 0.02))
    if plant_type == 'FERN':
        for i in range(7):
            angle = (i / 7) * 6.28; end = plant_top + mathutils.Vector((math.cos(angle)*0.25, math.sin(angle)*0.25, 0.1))
            _bmesh_vine(bm, plant_top, end, 0.008, 2)
    elif plant_type == 'SUCCULENT':
        ret = bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=8, radius=0.04, matrix=mathutils.Matrix.Translation(plant_top + mathutils.Vector((0,0,0.05))))
        for f in {f for v in ret['verts'] for f in v.link_faces}: f.material_index = 2
        for i in range(8):
            angle = (i / 8) * 6.28; loc = plant_top + mathutils.Vector((math.cos(angle)*0.08, math.sin(angle)*0.08, 0.02))
            ret = bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=8, radius=0.025, matrix=mathutils.Matrix.Translation(loc) @ mathutils.Euler((0.52, 0, angle)).to_matrix().to_4x4())
            for f in {f for v in ret['verts'] for f in v.link_faces}: f.material_index = 2
    elif plant_type == 'VINE':
        for i in range(4):
            angle = (i / 4) * 6.28; end = plant_top + mathutils.Vector((math.cos(angle)*0.4, math.sin(angle)*0.4, -0.3))
            _bmesh_vine(bm, plant_top, end, 0.006, 2)

    bm.to_mesh(mesh_data); bm.free()
    
    obj.data.materials.append(create_terracotta_material())
    import assets.exterior_garden as exterior_garden
    obj.data.materials.append(exterior_garden.create_soil_material())
    obj.data.materials.append(plant_humanoid.create_leaf_material(f"Mat_{cache_key}"))
    
    _plant_cache[cache_key] = sub_col
    return sub_col

def instance_at(master_collection, location, rotation=(0,0,0), name="Instance"):
    """Creates a collection instance at the specified location."""
    inst = bpy.data.objects.new(name, None)
    inst.instance_type = 'COLLECTION'
    inst.instance_collection = master_collection
    inst.location = location
    inst.rotation_euler = rotation
    bpy.context.scene.collection.objects.link(inst)
    return inst

def create_potted_plant(location, plant_type='FERN', name="PottedPlant"):
    """Point 94: Collection Instancing version of potted plants."""
    master_col = get_potted_plant_master(plant_type)
    # Add some random rotation to break repetition
    rot = (0, 0, random.uniform(0, 6.28))
    return instance_at(master_col, location, rotation=rot, name=name)

def create_potting_bench(location, name="PottingBench"):
    import assets.library_props as library_props
    mesh_data = bpy.data.meshes.new(f"{name}_MeshData"); obj = bpy.data.objects.new(name, mesh_data); bpy.context.scene.collection.objects.link(obj); obj.location = location
    bm = bmesh.new(); table_h, table_w, table_d = 1.0, 2.4, 0.8
    # Table top (merged planks)
    for i in range(8):
        x = -table_w/2 + (table_w/8) * (i + 0.5); ret = bmesh.ops.create_cube(bm, size=1.0, matrix=mathutils.Matrix.Translation((x, 0, table_h)))
        for v in ret['verts']: v.co.x *= (table_w/8 - 0.02); v.co.y *= table_d; v.co.z *= 0.05
        for f in {f for v in ret['verts'] for f in v.link_faces}: f.material_index = 0
    # Legs
    for lx, ly in [(-table_w/2 + 0.05, table_d/2 - 0.05), (table_w/2 - 0.05, table_d/2 - 0.05), (-table_w/2 + 0.05, -table_d/2 + 0.05), (table_w/2 - 0.05, -table_d/2 + 0.05)]:
        ret = bmesh.ops.create_cone(bm, segments=8, cap_ends=True, radius1=0.025, radius2=0.025, depth=table_h, matrix=mathutils.Matrix.Translation((lx, ly, table_h/2)))
        for f in {f for v in ret['verts'] for f in v.link_faces}: f.material_index = 1
    bm.to_mesh(mesh_data); bm.free()
    obj.data.materials.append(library_props.create_wood_material(f"{name}_WoodMat")); obj.data.materials.append(bpy.data.materials.get("GH_Iron") or bpy.data.materials.new("GH_Iron"))
    
    # Use Instancing for plants on bench
    for i, (pos, ptype) in enumerate(zip([(-0.8, -0.15, 1.02), (-0.3, 0.1, 1.02), (0.15, -0.05, 1.02), (0.6, 0.1, 1.02), (0.9, -0.15, 1.02)], ['FERN', 'SUCCULENT', 'VINE', 'SUCCULENT', 'FERN'])):
        p_obj = create_potted_plant(mathutils.Vector(location) + mathutils.Vector(pos), plant_type=ptype, name=f"{name}_Plant_{i}")
        p_obj.parent = obj
    return obj

def create_hanging_basket_master():
    """Point 79/Showcase: High-fidelity hanging basket master asset."""
    cache_key = "HangingBasketMaster"
    if cache_key in _plant_cache: return _plant_cache[cache_key]

    from assets import plant_humanoid
    master_col = get_master_collection()
    sub_col = bpy.data.collections.new(f"Col_{cache_key}")
    master_col.children.link(sub_col)
    
    mesh_data = bpy.data.meshes.new(f"Mesh_{cache_key}")
    obj = bpy.data.objects.new(f"Master_{cache_key}", mesh_data)
    sub_col.objects.link(obj)
    
    bm = bmesh.new()
    # Showcase-inspired lathe bowl geometry
    RINGS = 8; SEGS = 16
    radius = 0.25; depth = 0.20
    for ri in range(RINGS + 1):
        t = ri / RINGS
        angle = math.pi * 0.5 * t
        r = radius * math.cos(angle)
        z = -depth * math.sin(angle)
        for si in range(SEGS):
            a = 2 * math.pi * si / SEGS
            bm.verts.new((r * math.cos(a), r * math.sin(a), z))

    bm.verts.ensure_lookup_table()
    for ri in range(RINGS):
        for si in range(SEGS):
            nsi = (si + 1) % SEGS
            v1 = bm.verts[ri * SEGS + si]
            v2 = bm.verts[ri * SEGS + nsi]
            v3 = bm.verts[(ri + 1) * SEGS + nsi]
            v4 = bm.verts[(ri + 1) * SEGS + si]
            bm.faces.new([v1, v2, v3, v4])

    for f in bm.faces: f.material_index = 0

    # Trailing vines
    for i in range(12):
        angle = (i / 12) * 6.28 + random.uniform(-0.1, 0.1)
        r_off = radius * random.uniform(0.7, 0.9)
        start = mathutils.Vector((r_off * math.cos(angle), r_off * math.sin(angle), -0.05))
        _bmesh_vine(bm, start, start + mathutils.Vector((0, 0, -random.uniform(0.3, 0.6))), 0.005, 1)

    bm.to_mesh(mesh_data); bm.free()
    
    obj.data.materials.append(bpy.data.materials.get("GH_Iron") or bpy.data.materials.new("GH_Iron"))
    obj.data.materials.append(plant_humanoid.create_leaf_material(f"Mat_{cache_key}"))
    
    _plant_cache[cache_key] = sub_col
    return sub_col

def create_hanging_basket(location, name="HangingBasket"):
    master_col = create_hanging_basket_master()
    return instance_at(master_col, location, name=name)

def create_orchid_master(hue=(0.72, 0.12, 0.55)):
    """Creates a high-fidelity Orchid master collection."""
    cache_key = f"OrchidMaster_{hue}"
    if cache_key in _plant_cache: return _plant_cache[cache_key]

    from assets import plant_humanoid
    master_col = get_master_collection()
    sub_col = bpy.data.collections.new(f"Col_{cache_key}")
    master_col.children.link(sub_col)

    # Orchid Petal Material
    def make_petal_mat(name, p_hue, is_labellum=False):
        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
        nodes, links = mat.node_tree.nodes, mat.node_tree.links
        nodes.clear()
        node_out = nodes.new('ShaderNodeOutputMaterial')
        node_bsdf = nodes.new('ShaderNodeBsdfPrincipled')
        links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])

        node_coord = nodes.new('ShaderNodeTexCoord')
        node_mapping = nodes.new('ShaderNodeMapping')
        node_mapping.inputs['Scale'].default_value = (2, 2, 1)
        links.new(node_coord.outputs['UV'], node_mapping.inputs['Vector'])

        node_grad = nodes.new('ShaderNodeTexGradient')
        node_grad.gradient_type = 'RADIAL'
        links.new(node_mapping.outputs['Vector'], node_grad.inputs['Vector'])

        node_ramp = nodes.new('ShaderNodeValToRGB')
        elements = node_ramp.color_ramp.elements
        while len(elements) < 3: elements.new(0.5)
        elements[0].position, elements[0].color = 0.0, (*p_hue, 1.0)
        elements[1].position, elements[1].color = 0.5, (min(p_hue[0]+0.1,1), min(p_hue[1]+0.12,1), min(p_hue[2]+0.1,1), 1.0)
        elements[2].position, elements[2].color = 1.0, (1.0, 0.92, 0.95, 1.0)
        links.new(node_grad.outputs['Fac'], node_ramp.inputs['Fac'])

        # Showcase: Vein noise overlay
        node_noise = nodes.new('ShaderNodeTexNoise')
        node_noise.inputs['Scale'].default_value = 8.0
        node_noise.inputs['Detail'].default_value = 10.0
        node_noise.inputs['Roughness'].default_value = 0.7
        links.new(node_mapping.outputs['Vector'], node_noise.inputs['Vector'])

        node_vein_ramp = nodes.new('ShaderNodeValToRGB')
        v_elements = node_vein_ramp.color_ramp.elements
        while len(v_elements) < 3: v_elements.new(0.5)
        v_elements[0].position, v_elements[0].color = 0.0, (p_hue[0]*0.6, p_hue[1]*0.3, p_hue[2]*0.5, 1.0)
        v_elements[1].position, v_elements[1].color = 0.7, (*p_hue, 1.0)
        v_elements[2].position, v_elements[2].color = 1.0, (*p_hue, 1.0)
        links.new(node_noise.outputs['Fac'], node_vein_ramp.inputs['Fac'])

        node_mix_col = style.create_mix_node(mat.node_tree, blend_type='MIX', data_type='RGBA')
        f_sock, i1_sock, i2_sock = style.get_mix_sockets(node_mix_col)
        if f_sock: f_sock.default_value = 0.3
        links.new(node_ramp.outputs['Color'], i1_sock)
        links.new(node_vein_ramp.outputs['Color'], i2_sock)
        links.new(style.get_mix_output(node_mix_col), node_bsdf.inputs['Base Color'])

        # Showcase: Petal Bump
        node_bump = nodes.new('ShaderNodeBump')
        node_bump.inputs['Strength'].default_value = 0.3
        node_bump.inputs['Distance'].default_value = 0.005
        links.new(node_noise.outputs['Fac'], node_bump.inputs['Height'])
        links.new(node_bump.outputs['Normal'], node_bsdf.inputs['Normal'])

        node_bsdf.inputs['Roughness'].default_value = 0.12
        # Showcase SSS and Transmission settings
        style.set_principled_socket(node_bsdf, "Subsurface Weight", 0.25)
        if node_bsdf.inputs.get("Subsurface Radius"):
            node_bsdf.inputs["Subsurface Radius"].default_value = (0.9, 0.4, 0.5)
        if node_bsdf.inputs.get("Transmission Weight"):
            node_bsdf.inputs["Transmission Weight"].default_value = 0.15
        if node_bsdf.inputs.get("Subsurface Color"):
            node_bsdf.inputs["Subsurface Color"].default_value = (*p_hue, 1.0)
        return mat

    petal_mat = make_petal_mat(f"Mat_OrchidPetal_{cache_key}", hue)
    labellum_mat = make_petal_mat(f"Mat_OrchidLabellum_{cache_key}", (0.9, 0.55, 0.1), is_labellum=True)

    def add_petal_mesh(name, mat, loc, rot, sca):
        """Point 79/Showcase: Higher-fidelity petal geometry."""
        mesh = bpy.data.meshes.new(f"Mesh_{name}")
        obj = bpy.data.objects.new(name, mesh)
        sub_col.objects.link(obj)
        obj.location, obj.rotation_euler, obj.scale = loc, rot, sca
        bm = bmesh.new()
        # Increased SEGS for smoother curves
        SEGS = 12
        for li in range(SEGS+1):
            t = li/SEGS; w = math.sin(math.pi * t) * 0.5
            for wi in range(SEGS+1):
                s = wi/SEGS - 0.5; cup = -0.12*(1-(2*s)**2)*t
                bm.verts.new((s*w, cup, t))
        bm.verts.ensure_lookup_table()
        for l in range(SEGS):
            for w in range(SEGS):
                bm.faces.new([bm.verts[l*(SEGS+1)+w], bm.verts[l*(SEGS+1)+w+1], bm.verts[(l+1)*(SEGS+1)+w+1], bm.verts[(l+1)*(SEGS+1)+w]])
        bm.to_mesh(mesh); bm.free()
        obj.data.materials.append(mat)
        for p in obj.data.polygons: p.use_smooth = True

    # Build 5 petals + Labellum
    for i in range(5):
        angle = 2*math.pi*i/5; r = 0.15
        add_petal_mesh(f"Petal_{i}", petal_mat, (r*math.cos(angle), r*math.sin(angle), 0.6), (math.radians(-70), 0, angle + math.pi/2), (0.1, 0.1, 0.15))
    add_petal_mesh("Labellum", labellum_mat, (0, -0.05, 0.6), (math.radians(-80), 0, 0), (0.12, 0.12, 0.1))

    # Spike
    spike_mesh = bpy.data.meshes.new(f"Mesh_OrchidSpike_{cache_key}")
    spike_obj = bpy.data.objects.new("OrchidSpike", spike_mesh)
    sub_col.objects.link(spike_obj)
    bm = bmesh.new(); bmesh.ops.create_cone(bm, segments=8, radius1=0.01, radius2=0.005, depth=0.7, matrix=mathutils.Matrix.Translation((0,0,0.35)))
    bm.to_mesh(spike_mesh); bm.free()
    spike_mat = bpy.data.materials.new(name="Mat_OrchidSpike")
    style.set_principled_socket(spike_mat, 'Base Color', (0.2, 0.4, 0.1, 1))
    spike_obj.data.materials.append(spike_mat)

    _plant_cache[cache_key] = sub_col
    return sub_col

def create_orchid(location, name="Orchid"):
    master_col = create_orchid_master()
    return instance_at(master_col, location, name=name)

def setup_greenhouse_interior(greenhouse_size=(15, 15, 8)):
    w, d, h = greenhouse_size
    # Clear cache for fresh run
    _plant_cache.clear()
    
    for i, pos in enumerate([(-w/2 + 1.5, -3, -1), (-w/2 + 1.5, 3, -1), (w/2 - 1.5, -3, -1), (w/2 - 1.5, 3, -1), (0, d/2 - 1.5, -1)]):
        create_potting_bench(pos, name=f"PottingBench_{i}")
        # Add an orchid to each bench
        create_orchid(mathutils.Vector(pos) + mathutils.Vector((0.4, 0, 1.02)), name=f"BenchOrchid_{i}")

    create_display_island()
    for i, loc in enumerate([(-4, -4, h - 1), (4, -4, h - 1), (-4, 4, h - 1), (4, 4, h - 1), (0, 0, h - 0.5)]):
        create_hanging_basket(loc, name=f"HangingBasket_{i}")

def create_display_island():
    import assets.library_props as library_props
    mesh_data = bpy.data.meshes.new("Island_MeshData"); obj = bpy.data.objects.new("DisplayIsland", mesh_data); bpy.context.scene.collection.objects.link(obj); obj.location = (0, 0, -0.6)
    bm = bmesh.new(); ret = bmesh.ops.create_cube(bm, size=1.0)
    for v in ret['verts']: v.co.x *= 2.5; v.co.y *= 1.0; v.co.z *= 0.4
    bm.to_mesh(mesh_data); bm.free(); obj.data.materials.append(library_props.create_wood_material("IslandMat"))
    
    for i, loc in enumerate([(-1.5, 0, 0.2), (-0.5, 0.3, 0.2), (0.5, -0.2, 0.2), (1.5, 0.1, 0.2)]):
        p_obj = create_potted_plant(mathutils.Vector((0,0,-0.6)) + mathutils.Vector(loc), random.choice(['FERN', 'SUCCULENT', 'VINE']), f"IslandPlant_{i}")
        p_obj.parent = obj

    # Add a central showcase orchid
    create_orchid(mathutils.Vector((0, 0, -0.2)), name="ShowcaseOrchid").parent = obj

    return obj

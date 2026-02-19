import bpy
import math
import mathutils
import random
import style

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
    mat = bpy.data.materials.get("TerracottaMat") or bpy.data.materials.new(name="TerracottaMat")
    if mat.node_tree: return mat

    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()
    node_out = nodes.new('ShaderNodeOutputMaterial'); node_bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    node_noise = nodes.new('ShaderNodeTexNoise'); node_noise.inputs['Scale'].default_value = 20.0
    node_ramp = nodes.new('ShaderNodeValToRGB'); elements = node_ramp.color_ramp.elements
    elements[0].color, elements[1].color = (0.35, 0.12, 0.05, 1), (0.65, 0.28, 0.12, 1)
    links.new(node_noise.outputs['Fac'], node_ramp.inputs['Fac']); links.new(node_ramp.outputs['Color'], node_bsdf.inputs['Base Color'])
    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface']); node_bsdf.inputs['Roughness'].default_value = 0.85
    return mat

def _bmesh_vine(bm, start, end, radius, mat_idx):
    import bmesh
    segment_vec = end - start; rot = segment_vec.normalized().to_track_quat('Z', 'Y').to_matrix().to_4x4()
    # DEPTH is the length of the cylinder. BMesh create_cone depth is the total height.
    ret = bmesh.ops.create_cone(bm, segments=8, cap_ends=True, radius1=radius, radius2=radius, depth=segment_vec.length, matrix=mathutils.Matrix.Translation((start + end) / 2) @ rot)
    for f in {f for v in ret['verts'] for f in v.link_faces}: f.material_index = mat_idx

def get_potted_plant_master(plant_type='FERN'):
    """Creates a master potted plant collection for instancing."""
    cache_key = f"Potted_{plant_type}"
    if cache_key in _plant_cache:
        return _plant_cache[cache_key]

    import bmesh; from assets import plant_humanoid
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
    import bmesh; import assets.library_props as library_props
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
    """Master asset for hanging baskets."""
    cache_key = "HangingBasketMaster"
    if cache_key in _plant_cache: return _plant_cache[cache_key]

    import bmesh; from assets import plant_humanoid
    master_col = get_master_collection()
    sub_col = bpy.data.collections.new(f"Col_{cache_key}")
    master_col.children.link(sub_col)
    
    mesh_data = bpy.data.meshes.new(f"Mesh_{cache_key}")
    obj = bpy.data.objects.new(f"Master_{cache_key}", mesh_data)
    sub_col.objects.link(obj)
    
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=2, radius=0.2)
    for f in bm.faces: f.material_index = 0
    for i in range(6):
        angle = (i / 6) * 6.28; start = mathutils.Vector((math.cos(angle)*0.15, math.sin(angle)*0.15, -0.2))
        _bmesh_vine(bm, start, start + mathutils.Vector((math.cos(angle)*0.1, math.sin(angle)*0.1, -random.uniform(0.4, 0.8))), 0.005, 1)
    bm.to_mesh(mesh_data); bm.free()

    obj.data.materials.append(bpy.data.materials.get("GH_Iron") or bpy.data.materials.new("GH_Iron"))
    obj.data.materials.append(plant_humanoid.create_leaf_material(f"Mat_{cache_key}"))

    _plant_cache[cache_key] = sub_col
    return sub_col

def create_hanging_basket(location, name="HangingBasket"):
    master_col = create_hanging_basket_master()
    return instance_at(master_col, location, name=name)

def setup_greenhouse_interior(greenhouse_size=(15, 15, 8)):
    w, d, h = greenhouse_size
    # Clear cache for fresh run
    _plant_cache.clear()
    
    for i, pos in enumerate([(-w/2 + 1.5, -3, -1), (-w/2 + 1.5, 3, -1), (w/2 - 1.5, -3, -1), (w/2 - 1.5, 3, -1), (0, d/2 - 1.5, -1)]):
        create_potting_bench(pos, name=f"PottingBench_{i}")
    create_display_island()
    for i, loc in enumerate([(-4, -4, h - 1), (4, -4, h - 1), (-4, 4, h - 1), (4, 4, h - 1), (0, 0, h - 0.5)]):
        create_hanging_basket(loc, name=f"HangingBasket_{i}")

def create_display_island():
    import bmesh; import assets.library_props as library_props
    mesh_data = bpy.data.meshes.new("Island_MeshData"); obj = bpy.data.objects.new("DisplayIsland", mesh_data); bpy.context.scene.collection.objects.link(obj); obj.location = (0, 0, -0.6)
    bm = bmesh.new(); ret = bmesh.ops.create_cube(bm, size=1.0)
    for v in ret['verts']: v.co.x *= 2.5; v.co.y *= 1.0; v.co.z *= 0.4
    bm.to_mesh(mesh_data); bm.free(); obj.data.materials.append(library_props.create_wood_material("IslandMat"))

    for i, loc in enumerate([(-1.5, 0, 0.2), (-0.5, 0.3, 0.2), (0.5, -0.2, 0.2), (1.5, 0.1, 0.2)]):
        p_obj = create_potted_plant(mathutils.Vector((0,0,-0.6)) + mathutils.Vector(loc), random.choice(['FERN', 'SUCCULENT', 'VINE']), f"IslandPlant_{i}")
        p_obj.parent = obj
    return obj

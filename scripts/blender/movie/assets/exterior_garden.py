import bpy
import math
import mathutils
import random
import style

def create_hedge_material():
    mat = bpy.data.materials.get("HedgeMat")
    if mat: return mat

    mat = bpy.data.materials.new(name="HedgeMat")
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
    mat.displacement_method = 'BOTH'
    return mat

def create_hedge_row(start, end, height=2.5, depth=1.2, name="Hedge"):
    """Point 95: BMesh Hedge creation."""
    import bmesh
    direction = (mathutils.Vector(end) - mathutils.Vector(start))
    length = direction.length
    mid = (mathutils.Vector(start) + mathutils.Vector(end)) / 2
    angle = math.atan2(direction.y, direction.x)

    mesh_data = bpy.data.meshes.new(f"{name}_MeshData")
    hedge = bpy.data.objects.new(name, mesh_data)
    bpy.context.collection.objects.link(hedge)
    hedge.location = mid

    bm = bmesh.new()
    matrix = mathutils.Euler((0, 0, angle)).to_matrix().to_4x4()
    ret = bmesh.ops.create_cube(bm, size=1.0, matrix=matrix)
    for v in ret['verts']:
        v.co.x *= length
        v.co.y *= depth
        v.co.z *= height

    bm.to_mesh(mesh_data)
    bm.free()

    mat = create_hedge_material()
    hedge.data.materials.append(mat)

    return hedge

def create_garden_bed(location, size=(3, 1.5), name="GardenBed"):
    """Point 95: BMesh Garden Bed creation."""
    import bmesh
    from assets import plant_humanoid
    location = mathutils.Vector(location)

    mesh_data = bpy.data.meshes.new(f"{name}_MeshData")
    obj = bpy.data.objects.new(name, mesh_data)
    bpy.context.collection.objects.link(obj)
    obj.location = location

    bm = bmesh.new()
    # Soil
    ret = bmesh.ops.create_cube(bm, size=1.0, matrix=mathutils.Matrix.Translation((0,0,0.1)))
    for v in ret['verts']:
        v.co.x *= size[0]
        v.co.y *= size[1]
        v.co.z *= 0.12
    for f in ret['faces']: f.material_index = 0 # soil

    # Stones (simple BMesh border instead of particles)
    for i in range(20):
        angle = (i / 20) * math.pi * 2
        sx, sy = (size[0]/2 + 0.05) * math.cos(angle), (size[1]/2 + 0.05) * math.sin(angle)
        ret = bmesh.ops.create_cube(bm, size=0.1, matrix=mathutils.Matrix.Translation((sx, sy, 0.1)))
        for f in ret['faces']: f.material_index = 1 # stone

    bm.to_mesh(mesh_data)
    bm.free()

    obj.data.materials.append(create_soil_material())
    import greenhouse_structure
    obj.data.materials.append(greenhouse_structure.create_mossy_stone_mat(name=f"StoneMat_{name}"))
    
    # Flowers
    flower_colors = [(1, 0.2, 0.4), (1, 0.8, 0.1), (0.6, 0.2, 0.9), (1, 0.4, 0.1)]
    for i in range(random.randint(3, 6)):
        floc = location + mathutils.Vector((random.uniform(-size[0]/2 + 0.3, size[0]/2 - 0.3),
                                          random.uniform(-size[1]/2 + 0.2, size[1]/2 - 0.2), 0.22))
        f_obj = plant_humanoid.create_flower(floc, name=f"{name}_Flower_{i}", scale=random.uniform(0.15, 0.35))
        f_obj.parent = obj
        color = random.choice(flower_colors)
        if f_obj.data.materials:
            f_obj.data.materials[0].node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*color, 1)

    return obj

def create_exterior_garden(greenhouse_size=(15, 15, 8)):
    """Point 95: Optimized BMesh Exterior Garden."""
    w, d = greenhouse_size[0], greenhouse_size[1]
    padding = 3.0
    
    # Static meshes to join
    to_join = []

    # 1. Path
    path = create_garden_path(padding, d)
    to_join.append(path)

    # 2. Hedges
    hedge_y = -(d/2 + padding + 1.2)
    to_join.append(create_hedge_row((-w/2 - padding, hedge_y, -1), (-2.5, hedge_y, -1), name="HedgeFrontL"))
    to_join.append(create_hedge_row((2.5, hedge_y, -1), (w/2 + padding, hedge_y, -1), name="HedgeFrontR"))
    to_join.append(create_hedge_row((- (w/2 + padding + 1.2), -(d/2 + padding), -1), (- (w/2 + padding + 1.2), (d/2 + padding), -1), name="HedgeL"))
    to_join.append(create_hedge_row((w/2 + padding + 1.2, -(d/2 + padding), -1), (w/2 + padding + 1.2, (d/2 + padding), -1), name="HedgeR"))
    to_join.append(create_hedge_row((-w/2 - padding, d/2 + padding + 1.2, -1), (w/2 + padding, d/2 + padding + 1.2, -1), name="HedgeBack"))

    # 3. Ground
    ground_data = bpy.data.meshes.new("ExteriorGround_MeshData")
    ground = bpy.data.objects.new("ExteriorGround", ground_data)
    bpy.context.collection.objects.link(ground)
    ground.location = (0, 0, -1.02)
    import bmesh
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=100.0)
    bm.to_mesh(ground_data)
    bm.free()
    ground.data.materials.append(bpy.data.materials.get("GrassMat") or bpy.data.materials.new("GrassMat"))
    to_join.append(ground)

    # JOIN ALL
    bpy.ops.object.select_all(action='DESELECT')
    for o in to_join: o.select_set(True)
    bpy.context.view_layer.objects.active = to_join[0]
    bpy.ops.object.join()
    main_garden = bpy.context.view_layer.objects.active
    main_garden.name = "Exterior_Garden_Main"

    return main_garden

def create_garden_path(padding, d):
    import bmesh
    mesh_data = bpy.data.meshes.new("Path_MeshData")
    obj = bpy.data.objects.new("CobblestonePath", mesh_data)
    bpy.context.collection.objects.link(obj)
    obj.location = (0, -(d/2 + padding/2 + 0.6), -0.99)
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=1.0)
    for v in bm.verts:
        v.co.x *= 2.5
        v.co.y *= (padding + 1.5)
    bm.to_mesh(mesh_data)
    bm.free()
    obj.data.materials.append(bpy.data.materials.get("CobbleMat") or bpy.data.materials.new("CobbleMat"))
    return obj

    # --- Enhancement #32: Koi Pond in Garden Exterior ---
def create_koi_pond(location, size=(4, 6)):
        location = mathutils.Vector(location)
        bpy.ops.mesh.primitive_plane_add(size=1, location=location)
        pond = bpy.context.object
        pond.name = "KoiPond"
        pond.scale = (size[0]/2, size[1]/2, 1)

        mat = bpy.data.materials.new("PondMat")
        # mat.use_nodes = True
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
        node_noise.noise_dimensions = '4D'
        node_noise.inputs['W'].default_value = 0
        node_noise.inputs['W'].keyframe_insert(data_path="default_value", frame=1)
        node_noise.inputs['W'].default_value = 5.0
        node_noise.inputs['W'].keyframe_insert(data_path="default_value", frame=15000)

        pond.data.materials.append(mat)
        style.set_blend_method(mat, 'BLEND')
        
        static_garden_objects.append(pond)

        # Add simple fish objects (#32)
        # Keep fish separate for animation? Or join and animate via shape keys/bones?
        # User wants minimal meshes. Let's make fish ONE particle system on the pond?
        # Or just join them and animate locally? Joining animated objects is hard without bones.
        # Let's keep fish separate for now (5 meshes), but maybe reduce count to 3.
        for i in range(3):
            bpy.ops.mesh.primitive_cone_add(radius1=0.05, depth=0.2, location=location + mathutils.Vector((random.uniform(-1, 1), random.uniform(-2, 2), -0.1)))
            fish = bpy.context.object
            fish.name = f"Koi_{i}"
            fish.rotation_euler[0] = math.radians(90)
            fish.data.materials.append(bpy.data.materials.new(f"FishMat_{i}"))
            fish.data.materials[0].node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (1, 0.4, 0, 1) # Orange

            # Animate fish paths
            style.insert_looping_noise(fish, "location", strength=1.0, scale=100.0)

    create_koi_pond(location=(w/2 + 5, 0, -1.01))

    # --- Exterior grass ground plane (BMesh) ---
    ground_data = bpy.data.meshes.new("ExteriorGround_MeshData")
    ground = bpy.data.objects.new("ExteriorGround", ground_data)
    bpy.context.collection.objects.link(ground)
    ground.location = (0, 0, -1.02)

    bm_ground = bmesh.new()
    bmesh.ops.create_grid(bm_ground, x_segments=1, y_segments=1, size=100.0)
    bm_ground.to_mesh(ground_data)
    bm_ground.free()

    grass_mat = bpy.data.materials.new("GrassMat")
    # grass_mat.use_nodes = True
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
    static_garden_objects.append(ground)

    # FINAL JOIN
    if static_garden_objects:
        bpy.ops.object.select_all(action='DESELECT')
        for obj in static_garden_objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = static_garden_objects[0]
        # We must be careful about materials. Joining objects preserves material slots.
        bpy.ops.object.join()
        
        main_garden = bpy.context.active_object
        main_garden.name = "Exterior_Garden_Main"

    return beds

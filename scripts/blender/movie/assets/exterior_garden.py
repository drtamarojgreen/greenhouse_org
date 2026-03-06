import bpy
import math
import mathutils
import random
import style_utilities as style

def create_hedge_material():
    mat = bpy.data.materials.get("HedgeMat") or bpy.data.materials.new(name="HedgeMat")
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()

    node_out = nodes.new(type='ShaderNodeOutputMaterial')
    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')

    node_noise = nodes.new(type='ShaderNodeTexNoise')
    node_noise.inputs['Scale'].default_value = 30.0
    node_noise.inputs['Detail'].default_value = 8.0

    node_ramp = nodes.new(type='ShaderNodeValToRGB')
    elements = node_ramp.color_ramp.elements
    elements[0].position, elements[0].color = 0.3, (0.1, 0.2, 0.1, 1) # Brightened (Point 142)
    elements[1].position, elements[1].color = 0.7, (0.2, 0.4, 0.2, 1) # Brightened (Point 142)

    node_bump = nodes.new(type='ShaderNodeBump')
    node_bump.inputs['Strength'].default_value = 0.8

    links.new(node_noise.outputs['Fac'], node_ramp.inputs['Fac'])
    links.new(node_ramp.outputs['Color'], node_bsdf.inputs['Base Color'])
    links.new(node_noise.outputs['Fac'], node_bump.inputs['Height'])
    links.new(node_bump.outputs['Normal'], node_bsdf.inputs['Normal'])

    node_bsdf.inputs['Roughness'].default_value = 0.85
    node_bsdf.inputs['Subsurface Weight'].default_value = 0.08

    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])
    return mat

def create_soil_material():
    mat = bpy.data.materials.get("SoilMat") or bpy.data.materials.new(name="SoilMat")
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()

    node_out = nodes.new(type='ShaderNodeOutputMaterial')
    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')

    node_noise = nodes.new(type='ShaderNodeTexNoise')
    node_noise.inputs['Scale'].default_value = 15.0
    node_noise.inputs['Detail'].default_value = 10.0

    node_ramp = nodes.new(type='ShaderNodeValToRGB')
    elements = node_ramp.color_ramp.elements
    elements[0].position, elements[0].color = 0.2, (0.1, 0.05, 0.02, 1) # Brightened
    elements[1].position, elements[1].color = 0.8, (0.3, 0.15, 0.08, 1) # Brightened

    node_disp = nodes.new(type='ShaderNodeDisplacement')
    node_disp.inputs['Scale'].default_value = 0.02

    links.new(node_noise.outputs['Fac'], node_ramp.inputs['Fac'])
    links.new(node_ramp.outputs['Color'], node_bsdf.inputs['Base Color'])
    links.new(node_noise.outputs['Fac'], node_disp.inputs['Height'])
    links.new(node_disp.outputs['Displacement'], node_out.inputs['Displacement'])
    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])

    node_bsdf.inputs['Roughness'].default_value = 0.9
    node_bsdf.inputs['Specular IOR Level'].default_value = 0.4
    node_bsdf.inputs['Metallic'].default_value = 0.05
    mat.displacement_method = 'BOTH'
    return mat

def create_hedge_row(start, end, height=2.5, depth=1.2, name="Hedge"):
    import bmesh
    direction = (mathutils.Vector(end) - mathutils.Vector(start))
    mid = (mathutils.Vector(start) + mathutils.Vector(end)) / 2
    angle = math.atan2(direction.y, direction.x)

    mesh_data = bpy.data.meshes.new(f"{name}_MeshData")
    hedge = bpy.data.objects.new(name, mesh_data)
    bpy.context.scene.collection.objects.link(hedge)
    hedge.location = mid

    bm = bmesh.new()
    num_clusters = int(direction.length / 0.8) + 1
    for i in range(num_clusters):
        t = i / max(1, num_clusters - 1)
        p = direction * t
        # Random bush cluster
        ret = bmesh.ops.create_cone(bm, segments=8, radius1=0.5, radius2=0.4, depth=height, matrix=mathutils.Matrix.Translation(p + mathutils.Vector((0,0,height/2))))
        for v in ret['verts']:
            # Deform for organic volume
            v.co.y *= (depth / 0.8)
            v.co.x += random.uniform(-0.1, 0.1); v.co.y += random.uniform(-0.1, 0.1)
    
    # Rotate toward direction
    bm.transform(mathutils.Euler((0, 0, angle)).to_matrix().to_4x4())

    bm.to_mesh(mesh_data)
    bm.free()

    hedge.data.materials.append(create_hedge_material())
    return hedge

def create_garden_path(padding, d):
    import bmesh
    mesh_data = bpy.data.meshes.new("Path_MeshData")
    obj = bpy.data.objects.new("CobblestonePath", mesh_data)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = (0, -(d/2 + padding/2 + 0.6), -0.99)
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=1.0)
    for v in bm.verts:
        v.co.x *= 2.5; v.co.y *= (padding + 1.5)
    bm.to_mesh(mesh_data)
    bm.free()
    
    cobble_mat = bpy.data.materials.get("CobbleMat") or bpy.data.materials.new("CobbleMat")
    obj.data.materials.append(cobble_mat)
    return obj

def create_koi_pond(location, size=(4, 6)):
    import bmesh
    mesh_data = bpy.data.meshes.new("KoiPond_MeshData")
    pond = bpy.data.objects.new("KoiPond", mesh_data)
    bpy.context.scene.collection.objects.link(pond)
    pond.location = location
    
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=1.0)
    for v in bm.verts:
        v.co.x *= size[0]/2; v.co.y *= size[1]/2
    bm.to_mesh(mesh_data)
    bm.free()

    mat = bpy.data.materials.get("PondMat") or bpy.data.materials.new("PondMat")
    bsdf = mat.node_tree.nodes.get("Principled BSDF") or mat.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs['Base Color'].default_value = (0.05, 0.1, 0.2, 1)
    bsdf.inputs['Transmission Weight'].default_value = 0.8
    bsdf.inputs['Roughness'].default_value = 0.01
    style.set_blend_method(mat, 'BLENDED')
    if mat.name not in [m.name for m in pond.data.materials]: pond.data.materials.append(mat)
    
    return pond

def create_procedural_tree(location, bark_mat, leaf_mat):
    import bmesh, random, math
    name = f"Tree_{random.randint(0, 1000000)}"
    mesh = bpy.data.meshes.new(f"{name}_MeshData")
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location

    bm = bmesh.new()
    trunk_h = random.uniform(4, 7)

    # Trunk: tapered cone, not a cylinder - looks natural
    bmesh.ops.create_cone(bm, segments=6, cap_ends=True,
                          radius1=0.35, radius2=0.08, depth=trunk_h,
                          matrix=mathutils.Matrix.Translation((0, 0, trunk_h / 2)))

    # Canopy: many small offset spheres to create an organic crown, not a lollipop
    num_clusters = random.randint(8, 14)
    for i in range(num_clusters):
        angle = (i / num_clusters) * 2 * math.pi + random.uniform(-0.3, 0.3)
        radius_offset = random.uniform(0.5, 2.0)
        cx = math.cos(angle) * radius_offset
        cy = math.sin(angle) * radius_offset
        cz = trunk_h + random.uniform(-0.8, 2.0)
        cluster_r = random.uniform(0.8, 1.6)
        bmesh.ops.create_uvsphere(bm, u_segments=6, v_segments=5, radius=cluster_r,
                                  matrix=mathutils.Matrix.Translation((cx, cy, cz)))

    bm.to_mesh(mesh)
    bm.free()
    obj.data.materials.append(bark_mat)
    obj.data.materials.append(leaf_mat)
    return obj


def create_exterior_garden(greenhouse_size=(15, 15, 8)):
    w, d = greenhouse_size[0], greenhouse_size[1]
    padding = 3.0
    to_join = []

    to_join.append(create_garden_path(padding, d))
    hedge_y = -(d/2 + padding + 1.2)
    to_join.append(create_hedge_row((-w/2 - padding, hedge_y, -1), (-2.5, hedge_y, -1), name="HedgeFrontL"))
    to_join.append(create_hedge_row((2.5, hedge_y, -1), (w/2 + padding, hedge_y, -1), name="HedgeFrontR"))
    to_join.append(create_hedge_row((-(w/2 + padding + 1.2), -(d/2 + padding), -1), (-(w/2 + padding + 1.2), (d/2 + padding), -1), name="HedgeL"))
    to_join.append(create_hedge_row(((w/2 + padding + 1.2), -(d/2 + padding), -1), ((w/2 + padding + 1.2), (d/2 + padding), -1), name="HedgeR"))
    to_join.append(create_hedge_row((-w/2 - padding, d/2 + padding + 1.2, -1), (w/2 + padding, d/2 + padding + 1.2, -1), name="HedgeBack"))

    ground_data = bpy.data.meshes.new("ExteriorHill_MeshData")
    ground = bpy.data.objects.new("ExteriorHill", ground_data)
    bpy.context.scene.collection.objects.link(ground)
    ground.location = (0, 0, -1.0)
    
    import bmesh
    bm = bmesh.new()
    # Phase 6: Massive Ground Plane (No "End of Earth")
    bmesh.ops.create_grid(bm, x_segments=256, y_segments=256, size=2000.0)
    
    for v in bm.verts:
        dist = v.co.length
        # Maintain hill peak but extend falloff
        v.co.z = 25.0 * math.exp(-(dist**2) / (2 * (150.0**2))) - 25.0
        v.co.z -= (dist / 1000.0) * 50.0 # Gradual slope

    bm.to_mesh(ground_data)
    bm.free()
    
    grass_mat = bpy.data.materials.get("GrassMat") or bpy.data.materials.new("GrassMat")
    ground.data.materials.append(grass_mat)
    to_join.append(ground)

    bark_mat = bpy.data.materials.get("BarkMat_Herbaceous") or bpy.data.materials.new("BarkMat_Forest")
    leaf_mat = bpy.data.materials.get("LeafMat_Herbaceous") or bpy.data.materials.new("LeafMat_Forest")
    
    for i in range(150):
        angle = random.uniform(0, 2*math.pi)
        radius = random.uniform(35, 150)
        x = math.cos(angle) * radius
        y = math.sin(angle) * radius
        
        dist = math.sqrt(x*x + y*y)
        z = 15.0 * math.exp(-(dist**2) / (2 * (60.0**2))) - 15.0 - (dist / 250.0) * 15.0 - 1.0
        
        tree = create_procedural_tree((x, y, z), bark_mat, leaf_mat)
        to_join.append(tree)

    to_join.append(create_koi_pond((w/2 + 5, 0, -1.01)))

    bpy.ops.object.select_all(action='DESELECT')
    for o in to_join: o.select_set(True)
    bpy.context.view_layer.objects.active = to_join[0]
    bpy.ops.object.join()
    main_garden = bpy.context.view_layer.objects.active
    main_garden.name = "Exterior_Garden_Main"
    return main_garden

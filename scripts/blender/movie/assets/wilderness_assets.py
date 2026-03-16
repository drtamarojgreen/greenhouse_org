import bpy
import bmesh
import math
import mathutils
import random
import style_utilities as style

def create_rock_material(style_type="smooth"):
    mat = bpy.data.materials.get(f"RockMat_{style_type}") or bpy.data.materials.new(f"RockMat_{style_type}")
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()
    
    node_out = nodes.new(type='ShaderNodeOutputMaterial')
    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    
    if style_type == "jagged":
        node_bsdf.inputs['Base Color'].default_value = (0.05, 0.05, 0.06, 1) # Dark basalt
        node_bsdf.inputs['Roughness'].default_value = 0.9
        
        node_noise = nodes.new(type='ShaderNodeTexNoise')
        node_noise.inputs['Scale'].default_value = 15.0
        
        node_bump = nodes.new(type='ShaderNodeBump')
        node_bump.inputs['Strength'].default_value = 1.0
        links.new(node_noise.outputs['Fac'], node_bump.inputs['Height'])
        links.new(node_bump.outputs['Normal'], node_bsdf.inputs['Normal'])
        
    elif style_type == "smooth":
        node_bsdf.inputs['Base Color'].default_value = (0.2, 0.22, 0.25, 1) # Grey river rock
        node_bsdf.inputs['Roughness'].default_value = 0.6
        node_bsdf.inputs['Specular IOR Level'].default_value = 0.3
        
    elif style_type == "layered":
        node_bsdf.inputs['Base Color'].default_value = (0.3, 0.2, 0.15, 1) # Red/brown sandstone
        node_bsdf.inputs['Roughness'].default_value = 0.8
        
        node_musgrave = nodes.new(type='ShaderNodeTexMusgrave') if bpy.app.version < (4, 0, 0) else nodes.new(type='ShaderNodeTexNoise')
        if hasattr(node_musgrave, 'musgrave_dimensions'):
            node_musgrave.musgrave_dimensions = '1D'
        node_musgrave.inputs['Scale'].default_value = 10.0
        
        node_ramp = nodes.new(type='ShaderNodeValToRGB')
        node_ramp.color_ramp.elements[0].color = (0.2, 0.15, 0.1, 1)
        node_ramp.color_ramp.elements[1].color = (0.4, 0.3, 0.2, 1)
        
        links.new(node_musgrave.outputs[0], node_ramp.inputs['Fac'])
        links.new(node_ramp.outputs['Color'], node_bsdf.inputs['Base Color'])
        
    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])
    return mat

def create_proc_rock_formation(location, scale=1.0, style_type="smooth"):
    """
    Creates a procedural rock formation based on the given style.
    style_type: "jagged", "smooth", "layered"
    """
    name = f"Rock_{style_type}_{random.randint(0, 10000)}"
    mesh_data = bpy.data.meshes.new(f"{name}_MeshData")
    rock = bpy.data.objects.new(name, mesh_data)
    bpy.context.scene.collection.objects.link(rock)
    
    rock.location = location
    bm = bmesh.new()
    
    if style_type == "jagged":
        bmesh.ops.create_cone(bm, segments=5, radius1=scale, radius2=0, depth=scale*2)
        for v in bm.verts:
            v.co.x += random.uniform(-0.2*scale, 0.2*scale)
            v.co.y += random.uniform(-0.2*scale, 0.2*scale)
            if v.co.z > 0: v.co.z += random.uniform(-0.5*scale, 0.5*scale)
                
    elif style_type == "smooth":
        bmesh.ops.create_icosphere(bm, subdivisions=2, radius=scale)
        for v in bm.verts:
            v.co.z *= 0.6 # Flatten slightly
            v.co += mathutils.Vector((random.uniform(-0.1, 0.1), random.uniform(-0.1, 0.1), random.uniform(-0.1, 0.1))) * scale
            
    elif style_type == "layered":
        num_layers = random.randint(3, 7)
        for i in range(num_layers):
            z_offset = i * (scale * 0.4)
            layer_scale = scale * (1.0 - (i / num_layers * 0.5))
            ret = bmesh.ops.create_cube(bm, size=1.0, matrix=mathutils.Matrix.Translation((0, 0, z_offset)))
            for v in ret['verts']:
                v.co.x *= layer_scale * random.uniform(0.8, 1.2)
                v.co.y *= layer_scale * random.uniform(0.8, 1.2)
                v.co.z *= 0.4 * scale

    bm.to_mesh(mesh_data)
    bm.free()
    
    if style_type == "smooth" or style_type == "layered":
        mod = rock.modifiers.new(name="Bevel", type='BEVEL')
        mod.segments = 2
        mod.width = 0.1 * scale
        
    for p in rock.data.polygons: p.use_smooth = True
    rock.data.materials.append(create_rock_material(style_type))
    
    return rock

def create_proc_fern(location, scale=1.0):
    name = f"Fern_{random.randint(0, 10000)}"
    mesh_data = bpy.data.meshes.new(f"{name}_MeshData")
    fern = bpy.data.objects.new(name, mesh_data)
    bpy.context.scene.collection.objects.link(fern)
    fern.location = location
    
    bm = bmesh.new()
    num_leaves = random.randint(5, 9)
    for i in range(num_leaves):
        angle = (i / num_leaves) * 2 * math.pi
        length = scale * random.uniform(0.8, 1.2)
        
        # Simple arched leaf using connected verts
        verts = []
        num_segs = 5
        for j in range(num_segs):
            t = j / (num_segs - 1)
            dist = t * length
            h = math.sin(t * math.pi) * (length * 0.4)
            x = math.cos(angle) * dist
            y = math.sin(angle) * dist
            verts.append(bm.verts.new((x, y, h)))
            
        for j in range(num_segs - 1):
            if j < num_segs - 2: # Don't make face at very tip
                width = math.sin((j+0.5)/(num_segs-2) * math.pi) * (length * 0.2)
                v1 = bm.verts.new((verts[j].co.x + math.cos(angle+math.pi/2)*width, verts[j].co.y + math.sin(angle+math.pi/2)*width, verts[j].co.z))
                v2 = bm.verts.new((verts[j].co.x - math.cos(angle+math.pi/2)*width, verts[j].co.y - math.sin(angle+math.pi/2)*width, verts[j].co.z))
                v3 = bm.verts.new((verts[j+1].co.x + math.cos(angle+math.pi/2)*width*0.8, verts[j+1].co.y + math.sin(angle+math.pi/2)*width*0.8, verts[j+1].co.z))
                v4 = bm.verts.new((verts[j+1].co.x - math.cos(angle+math.pi/2)*width*0.8, verts[j+1].co.y - math.sin(angle+math.pi/2)*width*0.8, verts[j+1].co.z))
                bm.faces.new((v1, v3, verts[j+1], verts[j]))
                bm.faces.new((v2, verts[j], verts[j+1], v4))

    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=0.001)
    bm.to_mesh(mesh_data)
    bm.free()
    
    mat = bpy.data.materials.get("FernMat") or bpy.data.materials.new("FernMat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF") or mat.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs['Base Color'].default_value = (0.1, 0.3, 0.1, 1)
    bsdf.inputs['Roughness'].default_value = 0.4
    fern.data.materials.append(mat)
    
    return fern

def create_proc_crystal(location, scale=1.0):
    name = f"Crystal_{random.randint(0, 10000)}"
    mesh_data = bpy.data.meshes.new(f"{name}_MeshData")
    crystal = bpy.data.objects.new(name, mesh_data)
    bpy.context.scene.collection.objects.link(crystal)
    crystal.location = location
    
    bm = bmesh.new()
    segments = random.randint(5, 8)
    height = scale * random.uniform(1.5, 3.0)
    width = scale * random.uniform(0.3, 0.6)
    
    bmesh.ops.create_cone(bm, segments=segments, radius1=width, radius2=0.01, depth=height)
    for v in bm.verts:
        if v.co.z < 0:
            v.co.x += random.uniform(-0.1, 0.1) * width
            v.co.y += random.uniform(-0.1, 0.1) * width
        else:
            v.co.z += random.uniform(-0.2, 0.2) * height
            
    bm.to_mesh(mesh_data)
    bm.free()
    
    mat = bpy.data.materials.get("CrystalMat") or bpy.data.materials.new("CrystalMat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF") or mat.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs['Base Color'].default_value = (0.2, 0.8, 1.0, 1)
    bsdf.inputs['Transmission Weight'].default_value = 0.9
    bsdf.inputs['Roughness'].default_value = 0.1
    bsdf.inputs['Emission Color'].default_value = (0.1, 0.5, 1.0, 1)
    bsdf.inputs['Emission Strength'].default_value = 2.0
    crystal.data.materials.append(mat)
    
    return crystal

def create_proc_dead_tree(location, scale=1.0):
    name = f"DeadTree_{random.randint(0, 10000)}"
    mesh_data = bpy.data.meshes.new(f"{name}_MeshData")
    tree = bpy.data.objects.new(name, mesh_data)
    bpy.context.scene.collection.objects.link(tree)
    tree.location = location
    
    bm = bmesh.new()
    height = scale * random.uniform(4, 8)
    bmesh.ops.create_cone(bm, segments=6, radius1=scale*0.4, radius2=scale*0.05, depth=height, matrix=mathutils.Matrix.Translation((0,0,height/2)))
    
    # Simple branches
    num_branches = random.randint(3, 6)
    for i in range(num_branches):
        z_start = height * random.uniform(0.3, 0.8)
        b_len = scale * random.uniform(1.5, 4.0)
        angle = random.uniform(0, 2*math.pi)
        rot_mat = mathutils.Euler((0, random.uniform(0.5, 1.2), angle)).to_matrix().to_4x4()
        trans_mat = mathutils.Matrix.Translation((0,0,z_start))
        bmesh.ops.create_cone(bm, segments=4, radius1=scale*0.15, radius2=0.02, depth=b_len, matrix=trans_mat @ rot_mat @ mathutils.Matrix.Translation((0,0,b_len/2)))
        
    for v in bm.verts:
        v.co.x += random.uniform(-0.1, 0.1) * scale
        v.co.y += random.uniform(-0.1, 0.1) * scale

    for p in bm.faces: p.smooth = True
    bm.to_mesh(mesh_data)
    bm.free()
    
    mat = bpy.data.materials.get("DeadWoodMat") or bpy.data.materials.new("DeadWoodMat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF") or mat.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs['Base Color'].default_value = (0.1, 0.08, 0.08, 1)
    bsdf.inputs['Roughness'].default_value = 0.95
    tree.data.materials.append(mat)
    
    return tree

def create_proc_water_body(location, size=10.0, type="pond"):
    name = f"Water_{type}_{random.randint(0, 10000)}"
    mesh_data = bpy.data.meshes.new(f"{name}_MeshData")
    water = bpy.data.objects.new(name, mesh_data)
    bpy.context.scene.collection.objects.link(water)
    water.location = location
    
    bm = bmesh.new()
    segs = int(size * 2)
    segs = min(segs, 64) # Cap resolution
    
    if type == "pond":
        bmesh.ops.create_grid(bm, x_segments=segs, y_segments=segs, size=size)
        for v in bm.verts:
            if v.co.length > size/2:
                v.co.z -= 1.0 # Taper edges down
    elif type == "river":
        bmesh.ops.create_grid(bm, x_segments=segs*2, y_segments=int(segs/2), size=size)
        for v in bm.verts:
            v.co.x *= 3.0 # Stretch
            v.co.y += math.sin(v.co.x / size * math.pi) * (size*0.2) # Winding
            
    bm.to_mesh(mesh_data)
    bm.free()
    for p in water.data.polygons: p.use_smooth = True
    
    # Simple animated displacement
    tex = bpy.data.textures.get("WaterNoise") or bpy.data.textures.new("WaterNoise", 'CLOUDS')
    tex.noise_scale = size * 0.1
    mod = water.modifiers.new("WaterDisp", 'DISPLACE')
    mod.texture = tex
    mod.strength = 0.1
    
    mat = bpy.data.materials.get("WaterMat") or bpy.data.materials.new("WaterMat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF") or mat.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs['Base Color'].default_value = (0.1, 0.3, 0.4, 1)
    bsdf.inputs['Transmission Weight'].default_value = 0.95
    bsdf.inputs['Roughness'].default_value = 0.02
    bsdf.inputs['IOR'].default_value = 1.33
    style.set_blend_method(mat, 'BLENDED')
    
    water.data.materials.append(mat)
    return water

def create_proc_terrain(location, size=50.0, type="flat"):
    name = f"Terrain_{type}_{random.randint(0, 10000)}"
    mesh_data = bpy.data.meshes.new(f"{name}_MeshData")
    terrain = bpy.data.objects.new(name, mesh_data)
    bpy.context.scene.collection.objects.link(terrain)
    terrain.location = location
    
    bm = bmesh.new()
    segs = 64
    bmesh.ops.create_grid(bm, x_segments=segs, y_segments=segs, size=size)
    
    for v in bm.verts:
        dist = v.co.length
        if type == "bowl":
            v.co.z = (dist**2) / (size * 5)
        elif type == "hill":
            v.co.z = 10.0 * math.exp(-(dist**2) / (2 * ((size*0.3)**2)))
        elif type == "canyon":
            v.co.z = abs(v.co.x) * 0.5 + random.uniform(-0.5, 0.5)
            
        v.co.z += random.uniform(-0.1, 0.1)
        
    for p in bm.faces: p.smooth = True
    bm.to_mesh(mesh_data)
    bm.free()
    
    mat = bpy.data.materials.get("TerrainMat") or bpy.data.materials.new("TerrainMat")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF") or mat.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs['Base Color'].default_value = (0.15, 0.1, 0.05, 1)
    bsdf.inputs['Roughness'].default_value = 0.9
    terrain.data.materials.append(mat)
    return terrain

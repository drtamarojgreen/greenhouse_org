import bpy
import bmesh
import math
import mathutils
import random
import style_utilities as style
from assets.exterior_garden import create_procedural_tree, create_soil_material

def create_misty_mountain():
    """Scene 00: Misty mountain peak at sunrise."""
    mesh_data = bpy.data.meshes.new("MistyMountain_MeshData")
    mountain = bpy.data.objects.new("MistyMountain", mesh_data)
    bpy.context.scene.collection.objects.link(mountain)
    mountain.location = (0, 0, -1.0)
    
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=64, y_segments=64, size=100.0)
    for v in bm.verts:
        dist = v.co.length
        # Steep rocky cliff/peak falloff
        v.co.z = 20.0 * math.exp(-(dist**2) / (2 * (15.0**2))) - 20.0
        # Add jagged noise
        v.co.z += random.uniform(-0.5, 0.5) if dist > 5 else random.uniform(-0.1, 0.1)

    bm.to_mesh(mesh_data)
    bm.free()

    mat = bpy.data.materials.get("MountainMat") or bpy.data.materials.new("MountainMat")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF") or nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs['Base Color'].default_value = (0.2, 0.2, 0.22, 1) # Gray rock
    bsdf.inputs['Roughness'].default_value = 0.9
    mountain.data.materials.append(mat)
    
    return mountain

def create_forest_clearing():
    """Scene 01: Sunlit, dense deciduous forest clearing."""
    clearing = bpy.data.objects.new("ForestClearing", None) # Empty parent
    bpy.context.scene.collection.objects.link(clearing)
    
    mesh_data = bpy.data.meshes.new("ForestGround_MeshData")
    ground = bpy.data.objects.new("ForestGround", mesh_data)
    bpy.context.scene.collection.objects.link(ground)
    ground.parent = clearing
    ground.location = (0, 0, -0.5)
    
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=64, y_segments=64, size=60.0)
    for v in bm.verts:
        dist = v.co.length
        v.co.z = random.uniform(-0.2, 0.2) + (dist / 20.0) # Slight bowl shape
    bm.to_mesh(mesh_data)
    bm.free()

    ground.data.materials.append(create_soil_material())
    
    bark_mat = bpy.data.materials.get("BarkMat_Herbaceous") or bpy.data.materials.new("BarkMat_Forest")
    leaf_mat = bpy.data.materials.get("LeafMat_Herbaceous") or bpy.data.materials.new("LeafMat_Forest")
    
    # Dense trees in a ring around the center
    for i in range(80):
        angle = random.uniform(0, 2*math.pi)
        radius = random.uniform(8, 25)
        x = math.cos(angle) * radius
        y = math.sin(angle) * radius
        z = -0.5 + (radius/20.0)
        tree = create_procedural_tree((x, y, z), bark_mat, leaf_mat)
        tree.parent = clearing
        
    return clearing

def create_bioluminescent_cave():
    """Scene Brain: Deep inside a glowing bioluminescent cave."""
    cave = bpy.data.objects.new("BioCave", None)
    bpy.context.scene.collection.objects.link(cave)
    
    # Ground
    mesh_data = bpy.data.meshes.new("CaveGround_MeshData")
    ground = bpy.data.objects.new("CaveGround", mesh_data)
    bpy.context.scene.collection.objects.link(ground)
    ground.parent = cave
    ground.location = (0, 0, -0.5)
    
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=32, y_segments=32, size=40.0)
    for v in bm.verts:
        v.co.z = random.uniform(-0.3, 0.3)
    bm.to_mesh(mesh_data)
    bm.free()
    
    mat_rock = bpy.data.materials.get("CaveRockMat") or bpy.data.materials.new("CaveRockMat")
    mat_rock.use_nodes = True
    bsdf = mat_rock.node_tree.nodes.get("Principled BSDF") or mat_rock.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs['Base Color'].default_value = (0.02, 0.02, 0.03, 1) # Very dark wet rock
    bsdf.inputs['Roughness'].default_value = 0.2
    bsdf.inputs['Specular IOR Level'].default_value = 0.8
    ground.data.materials.append(mat_rock)
    
    # Glowing mushrooms/crystals
    mat_glow = bpy.data.materials.get("BioGlowMat") or bpy.data.materials.new("BioGlowMat")
    mat_glow.use_nodes = True
    bsdf_glow = mat_glow.node_tree.nodes.get("Principled BSDF") or mat_glow.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf_glow.inputs['Base Color'].default_value = (0.1, 0.8, 0.9, 1)
    bsdf_glow.inputs['Emission Color'].default_value = (0.1, 0.8, 0.9, 1)
    bsdf_glow.inputs['Emission Strength'].default_value = 5.0
    
    for i in range(40):
        angle = random.uniform(0, 2*math.pi)
        radius = random.uniform(4, 15)
        x = math.cos(angle) * radius
        y = math.sin(angle) * radius
        
        bm_shroom = bmesh.new()
        bmesh.ops.create_cone(bm_shroom, segments=8, radius1=0.2, radius2=0.01, depth=0.8)
        mesh_shroom = bpy.data.meshes.new("ShroomMesh")
        bm_shroom.to_mesh(mesh_shroom)
        bm_shroom.free()
        
        shroom = bpy.data.objects.new("GlowShroom", mesh_shroom)
        bpy.context.scene.collection.objects.link(shroom)
        shroom.parent = cave
        shroom.location = (x, y, -0.5 + random.uniform(0, 0.3))
        shroom.data.materials.append(mat_glow)
        
    return cave

import bpy
import bmesh
import math

def create_seedling_material():
    mat = bpy.data.materials.new(name="SeedlingPulse")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs['Base Color'].default_value = (0.2, 1.0, 0.4, 1)
    bsdf.inputs['Emission Color'].default_value = (0.3, 1.0, 0.5, 1)
    bsdf.inputs['Emission Strength'].default_value = 5.0
    return mat

def create_seedling(location=(0,0,1)):
    """The central focus: a tiny glowing plant sprout."""
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.05, location=location)
    obj = bpy.context.object
    obj.name = "Seedling"
    obj.data.materials.append(create_seedling_material())
    return obj

def create_blight_material():
    mat = bpy.data.materials.new(name="BlightShadow")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    bsdf.inputs['Base Color'].default_value = (0.01, 0, 0.02, 1)
    bsdf.inputs['Roughness'].default_value = 0.01
    bsdf.inputs['Metallic'].default_value = 1.0
    return mat

def create_blight_blob(location=(0,0,0)):
    """Antagonist: A distorted, oily mesh."""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=0.5, location=location)
    obj = bpy.context.object
    obj.name = "Blight_Core"
    obj.data.materials.append(create_blight_material())
    
    # Add Displace for 'oily' distortion
    mod = obj.modifiers.new("BlightDistort", 'DISPLACE')
    tex = bpy.data.textures.new("BlightNoise", 'CLOUDS')
    tex.noise_scale = 0.5
    mod.texture = tex
    return obj

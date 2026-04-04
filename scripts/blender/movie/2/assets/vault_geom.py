import bpy
import bmesh
import random
import mathutils

def create_metal_vault_material():
    mat = bpy.data.materials.new(name="VaultMetal")
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()
    
    node_out = nodes.new(type='ShaderNodeOutputMaterial')
    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    node_bsdf.inputs['Base Color'].default_value = (0.1, 0.12, 0.15, 1)
    node_bsdf.inputs['Metallic'].default_value = 0.95
    node_bsdf.inputs['Roughness'].default_value = 0.25
    
    # Professional Touch: Add Ambient Occlusion for depth
    node_ao = nodes.new(type='ShaderNodeAmbientOcclusion')
    node_mix = nodes.new(type='ShaderNodeMix')
    node_mix.data_type = 'RGBA'
    node_mix.blend_type = 'MULTIPLY'
    
    links.new(node_ao.outputs['Color'], node_mix.inputs[6]) # A
    links.new(node_bsdf.outputs['BSDF'], node_mix.inputs[7]) # B
    links.new(node_mix.outputs[2], node_out.inputs['Surface'])
    return mat

def create_vault_structure(size=40):
    """
    Creates the structural skeleton of the Seed Vault.
    Structural Beams ensure we have a 'safe' camera track.
    """
    mesh = bpy.data.meshes.new("Vault_Structure")
    obj = bpy.data.objects.new("Vault_Structure", mesh)
    bpy.context.scene.collection.objects.link(obj)
    
    bm = bmesh.new()
    
    # Floor Grid (Structural)
    step = size / 10
    for i in range(11):
        x = -size/2 + i * step
        # X-Beams
        ret = bmesh.ops.create_cube(bm, size=0.2, matrix=mathutils.Matrix.Translation((0, x, 0)))
        for v in ret['verts']: v.co.x *= size # Stretch to full width
        
        # Y-Beams
        ret = bmesh.ops.create_cube(bm, size=0.2, matrix=mathutils.Matrix.Translation((x, 0, 0)))
        for v in ret['verts']: v.co.y *= size
        
    # Vertical Pillars
    for x in [-size/2, size/2]:
        for y in [-size/2, size/2]:
            ret = bmesh.ops.create_cube(bm, size=0.4, matrix=mathutils.Matrix.Translation((x, y, size/2)))
            for v in ret['verts']: v.co.z *= (size) # Tall pillars
            
    bm.to_mesh(mesh)
    bm.free()
    
    obj.data.materials.append(create_metal_vault_material())
    return obj

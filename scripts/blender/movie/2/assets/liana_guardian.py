import bpy
import bmesh
import math
import mathutils

def create_vine_material():
    mat = bpy.data.materials.new(name="LianaVine")
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    nodes.clear()
    
    node_out = nodes.new(type='ShaderNodeOutputMaterial')
    node_bsdf = nodes.new(type='ShaderNodeBsdfPrincipled')
    node_bsdf.inputs['Base Color'].default_value = (0.05, 0.2, 0.05, 1)
    
    # Cycles-First: Subsurface Scattering for organic look
    node_bsdf.inputs['Subsurface Weight'].default_value = 0.3
    node_bsdf.inputs['Subsurface Radius'].default_value = (0.1, 0.2, 0.05)
    
    links.new(node_bsdf.outputs['BSDF'], node_out.inputs['Surface'])
    return mat

def create_guardian(location=(0,0,0)):
    """
    Procedural Humanoid: Liana.
    Composed of entwined vine 'strands'.
    """
    mesh = bpy.data.meshes.new("Liana_Mesh")
    obj = bpy.data.objects.new("Liana", mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location
    
    bm = bmesh.new()
    height = 2.0
    num_strands = 12
    
    for s in range(num_strands):
        angle_off = (s / num_strands) * 2 * math.pi
        verts = []
        for i in range(20):
            t = i / 19
            z = t * height
            # Helical entwinement
            radius = 0.2 * (1.0 - t*0.8) # Taper at top
            x = math.cos(t * 10.0 + angle_off) * radius
            y = math.sin(t * 10.0 + angle_off) * radius
            verts.append(bm.verts.new((x, y, z)))
            
        for i in range(19):
            bm.edges.new((verts[i], verts[i+1]))
            
    # Skin the vines
    bm.to_mesh(mesh)
    bm.free()
    
    # Add Skin and Subdivision for volume
    obj.modifiers.new("Skin", 'SKIN')
    obj.modifiers.new("Subsurf", 'SUBSURF')
    
    obj.data.materials.append(create_vine_material())
    return obj

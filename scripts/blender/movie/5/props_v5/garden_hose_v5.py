import bpy
import bmesh
import math
import mathutils

def create_garden_hose_v5(name="GardenHose", location=(0,0,0)):
    """Procedural garden hose asset."""
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location
    
    bm = bmesh.new()
    
    # 1. Nozzle (Cylinder + Cone)
    # Shift up slightly to avoid clipping with ground
    nozzle_matrix = mathutils.Matrix.Translation((0, 0, 0.05))
    bmesh.ops.create_cone(bm, segments=12, cap_ends=True, radius1=0.04, radius2=0.02, depth=0.1, matrix=nozzle_matrix)
    # Brass material for nozzle
    
    # 2. Hose (Curved Cylinder / Path)
    # For now, a coiled cylinder at the base
    for i in range(20):
        angle = (i/5) * math.pi
        r = 0.2 + (i * 0.01)
        # Spiral
        h_loc = (r * math.cos(angle), r * math.sin(angle), i * 0.02)
        bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=8, radius=0.015, 
                                  matrix=mathutils.Matrix.Translation(h_loc))

    bm.to_mesh(mesh)
    bm.free()
    
    # Materials
    nozzle_mat = bpy.data.materials.new(name=f"{name}_NozzleMat")
    nozzle_mat.use_nodes = True
    nozzle_mat.node_tree.nodes["Principled BSDF"].inputs[0].default_value = (0.8, 0.6, 0.2, 1) # Brass
    
    hose_mat = bpy.data.materials.new(name=f"{name}_HoseMat")
    hose_mat.use_nodes = True
    hose_mat.node_tree.nodes["Principled BSDF"].inputs[0].default_value = (0.2, 0.6, 0.2, 1) # Green
    
    obj.data.materials.append(hose_mat)
    
    return obj

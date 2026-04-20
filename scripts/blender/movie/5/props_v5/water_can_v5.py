import bpy
import bmesh
import math
import mathutils

def create_water_can_v5(name="WaterCan", location=(0,0,0)):
    """Procedural water can asset."""
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location
    
    bm = bmesh.new()
    
    # 1. Body (Cylinder)
    # Shift up by 0.2 so base is at Z=0
    body_matrix = mathutils.Matrix.Translation((0, 0, 0.2))
    bmesh.ops.create_cone(bm, segments=16, cap_ends=True, radius1=0.2, radius2=0.2, depth=0.4, matrix=body_matrix)
    
    # 2. Spout (Cone)
    spout_loc = (0, -0.2, 0.2)
    spout_matrix = (mathutils.Matrix.Translation(spout_loc) @ 
                    mathutils.Euler((math.radians(-45), 0, 0)).to_matrix().to_4x4())
    bmesh.ops.create_cone(bm, segments=12, cap_ends=True, radius1=0.03, radius2=0.08, depth=0.3, matrix=spout_matrix)
    
    # 3. Handle (Torus-like arch)
    # Simple arch using a curved strip
    for i in range(10):
        angle = (i/9) * math.pi
        h_loc = (0, 0.15 * math.cos(angle) + 0.1, 0.25 * math.sin(angle) + 0.2)
        bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=8, radius=0.02, 
                                  matrix=mathutils.Matrix.Translation(h_loc))

    bm.to_mesh(mesh)
    bm.free()
    
    # Material
    mat = bpy.data.materials.new(name=f"{name}_Mat")
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs[0].default_value = (0.2, 0.4, 0.8, 1) # Blue
    obj.data.materials.append(mat)
    
    return obj

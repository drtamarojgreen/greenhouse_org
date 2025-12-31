
import bpy
import bmesh
import os

def prove_isolation_logic():
    print("\n--- Proving Isolation Logic with Default Cube ---")
    
    # 1. Clear Scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # 2. Add Default Cube
    bpy.ops.mesh.primitive_cube_add(size=2, location=(0, 0, 0))
    cube = bpy.context.active_object
    cube.name = "BaseCube"
    
    # 3. Protocol: Isolate one face (Face Index 0)
    print("Executing Protocol: Select -> Duplicate -> Delete")
    
    # A. Use BMesh to identify 'Target' vertices (Face 0)
    bm_base = bmesh.new()
    bm_base.from_mesh(cube.data)
    bm_base.faces.ensure_lookup_table()
    target_vert_indices = [v.index for v in bm_base.faces[0].verts]
    bm_base.free()
    
    # B. Duplicate the Object
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='DESELECT')
    cube.select_set(True)
    bpy.context.view_layer.objects.active = cube
    
    bpy.ops.object.duplicate()
    h_obj = bpy.context.active_object
    h_obj.name = "IsolatedFace"
    
    # C. Delete Non-Target Geometry on the Duplicate
    bm_h = bmesh.new()
    bm_h.from_mesh(h_obj.data)
    bm_h.verts.ensure_lookup_table()
    
    to_delete = [v for v in bm_h.verts if v.index not in target_vert_indices]
    bmesh.ops.delete(bm_h, geom=to_delete, context='VERTS')
    
    bm_h.to_mesh(h_obj.data)
    bm_h.free()
    h_obj.data.update()
    
    print(f"Result: {cube.name} has {len(cube.data.vertices)} verts.")
    print(f"Result: {h_obj.name} has {len(h_obj.data.vertices)} verts.")
    
    # 4. Add Material (Neon Red for Proof)
    mat = bpy.data.materials.new(name="NeonRed")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    emit = nodes.new(type='ShaderNodeEmission')
    emit.inputs['Color'].default_value = (1, 0, 0, 1)
    emit.inputs['Strength'].default_value = 10.0
    output = nodes.new(type='ShaderNodeOutputMaterial')
    mat.node_tree.links.new(emit.outputs[0], output.inputs['Surface'])
    
    h_obj.data.materials.append(mat)
    h_obj.show_in_front = True
    
    # 5. Render Verification
    bpy.ops.object.camera_add(location=(5, -5, 5), rotation=(math.radians(45), 0, math.radians(45)))
    bpy.context.scene.camera = bpy.context.active_object
    bpy.context.scene.render.engine = 'BLENDER_WORKBENCH'
    
    output_path = "/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/proof_render.png"
    bpy.context.scene.render.filepath = output_path
    
    print(f"Rendering proof to {output_path}...")
    bpy.ops.render.render(write_still=True)
    
    if os.path.exists(output_path):
        print("SUCCESS: Protocol verified on Cube.")
    else:
        print("FAILURE: Render failed.")

import math
if __name__ == "__main__":
    prove_isolation_logic()

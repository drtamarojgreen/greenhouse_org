
import bpy
import bmesh
import os
import math
import mathutils

def isolate_brain_subset():
    print("\n--- Isolating 4 Vertices on Brain Mesh ---")
    
    # 1. Clear Scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # 2. Import Brain
    fbx_path = '/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/brain.fbx'
    if not os.path.exists(fbx_path):
        print(f"Error: FBX not found at {fbx_path}")
        return
        
    bpy.ops.import_scene.fbx(filepath=fbx_path)
    if not bpy.context.selected_objects:
        print("Error: No objects selected after import.")
        return
        
    brain = bpy.context.selected_objects[0]
    brain.name = "BaseBrain"
    brain.location = (0, 0, 0)
    
    # Fix context
    bpy.context.view_layer.objects.active = brain
    brain.select_set(True)
    
    # 3. Protocol: Isolate 4 Vertices (Indices 0, 1, 2, 3)
    print("Executing Protocol: Select -> Duplicate -> Delete (4 Verts)")
    
    # Target Indices
    target_indices = {0, 1, 2, 3}
    
    # Use bmesh to find target world locations for camera focus
    bm_orig = bmesh.new()
    bm_orig.from_mesh(brain.data)
    bm_orig.verts.ensure_lookup_table()
    target_locs = [brain.matrix_world @ v.co for v in bm_orig.verts if v.index in target_indices]
    avg_loc = sum(target_locs, mathutils.Vector((0,0,0))) / len(target_locs) if target_locs else mathutils.Vector((0,0,0))
    bm_orig.free()
    
    # B. Duplicate using stable Data-Block method
    bpy.ops.object.mode_set(mode='OBJECT')
    h_obj = brain.copy()
    h_obj.data = brain.data.copy()
    h_obj.name = "Isolated_4_Verts"
    bpy.context.scene.collection.objects.link(h_obj)
    
    # C. Delete Non-Target Geometry
    bm = bmesh.new()
    bm.from_mesh(h_obj.data)
    bm.verts.ensure_lookup_table()
    
    to_delete = [v for v in bm.verts if v.index not in target_indices]
    bmesh.ops.delete(bm, geom=to_delete, context='VERTS')
    
    bm.to_mesh(h_obj.data)
    bm.free()
    
    # Validate and Update
    h_obj.data.update()
    h_obj.data.validate()
    
    print(f"BaseBrain Verts: {len(brain.data.vertices)}")
    print(f"Isolated_4_Verts Verts: {len(h_obj.data.vertices)}")
    
    # 4. Add Material (Neon Cyan)
    mat = bpy.data.materials.new(name="NeonCyan")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    emit = nodes.new(type='ShaderNodeEmission')
    emit.inputs['Color'].default_value = (0.1, 1.0, 1.0, 1)
    emit.inputs['Strength'].default_value = 10.0
    output = nodes.new(type='ShaderNodeOutputMaterial')
    mat.node_tree.links.new(emit.outputs[0], output.inputs['Surface'])
    
    h_obj.data.materials.append(mat)
    h_obj.show_in_front = True
    
    # Final Visibility Setup
    brain.color = (0.05, 0.05, 0.05, 1) # Dim the base brain
    
    # 5. Render
    # Position camera near the avg_loc of the isolated verts
    cam_loc = avg_loc + mathutils.Vector((0, -0.5, 0.5))
    bpy.ops.object.camera_add(location=cam_loc)
    camera = bpy.context.active_object
    bpy.context.scene.camera = camera
    
    # Track to the isolated verts
    track = camera.constraints.new(type='TRACK_TO')
    track.target = h_obj
    track.track_axis = 'TRACK_NEGATIVE_Z'
    track.up_axis = 'UP_Y'
    
    bpy.context.scene.render.engine = 'BLENDER_WORKBENCH'
    
    output_path = "/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/proof_4_verts.png"
    bpy.context.scene.render.filepath = output_path
    
    print(f"Rendering proof to {output_path}...")
    bpy.ops.render.render(write_still=True)
    
    if os.path.exists(output_path):
        print("SUCCESS: 4-vertex isolation from Brain verified.")
    else:
        print("FAILURE: Render failed.")

if __name__ == "__main__":
    isolate_brain_subset()

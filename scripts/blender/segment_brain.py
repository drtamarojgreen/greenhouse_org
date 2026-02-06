import bpy
import json
import os
import sys
import bmesh

# --- SCRIPT SETUP ---
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.append(script_dir)

def clean_scene():
    if bpy.context.object and bpy.context.object.mode == 'EDIT':
        bpy.ops.object.mode_set(mode='OBJECT')
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

def segment_brain(fbx_path, predictions_path, output_blend_path):
    print(f"--- Starting Segmentation ---")
    print(f"FBX: {fbx_path}")
    print(f"Predictions: {predictions_path}")

    # 1. Load Data
    with open(predictions_path, 'r') as f:
        # Format: {"RegionName": [vertex_indices...], ...}
        region_map = json.load(f)

    # 2. Import Mesh
    clean_scene()
    # Pass files parameter to avoid Blender 5.0+ AttributeError
    bpy.ops.import_scene.fbx(filepath=fbx_path, files=[{"name": os.path.basename(fbx_path)}])
    # Assume single mesh object imported
    original_obj = bpy.context.selected_objects[0]
    original_obj.name = "Brain_Full"
    
    # Ensure we are in object mode
    bpy.ops.object.mode_set(mode='OBJECT')
    
    # 3. Create Region Objects
    # Strategy: Duplicate full mesh for each region, then delete non-region vertices.
    # This preserves all mesh properties (normals, UVs) better than constructing from scratch.
    # However, for 100+ regions, this might be slow.
    # Better Strategy: Deselect all verices, select region vertices, separate (P).
    
    # To Separate (P) in loop, we need to keep selecting from the *residual* mesh or the *original*?
    # Separate removes vertices from the object.
    # So we can loop through regions, select vertices, separate.
    # But wait, 'predictions' likely cover all vertices.
    
    bpy.context.view_layer.objects.active = original_obj
    
    # Switch to Edit Mode to process vertices
    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(original_obj.data)
    bm.verts.ensure_lookup_table()
    
    # We need a way to map vertex indices. Splitting changes indices.
    # Actually, we can assign materials or vertex groups first, then separate by material/group?
    # Or just selection.
    
    print("Assigning vertices to vertex groups...")
    # It's faster to do this in Object mode via vertex groups api?
    bpy.ops.object.mode_set(mode='OBJECT')
    
    for region_name, indices in region_map.items():
        if not indices:
            continue
            
        # Create Vertex Group
        vg = original_obj.vertex_groups.new(name=region_name)
        vg.add(indices, 1.0, 'REPLACE')
        
    print("Separating regions...")
    # Now separate by loose parts? No, separate by selection.
    # But we have multiple groups.
    # Blender 'Separate' operator works on selection.
    
    # We will iterate through groups, select, separate.
    # Note: When we separate, the new object takes those vertices. The old object loses them.
    # So we can just chip away at the block.
    
    for region_name in region_map.keys():
        # Get the group
        vg = original_obj.vertex_groups.get(region_name)
        if not vg:
            continue
            
        # Select vertices in this group
        # We need to do this in Edit Mode or via code selection
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='DESELECT')
        
        # Select by vertex group is an operator
        bpy.ops.object.vertex_group_set_active(group=region_name)
        bpy.ops.object.vertex_group_select()
        
        # Check if anything selected
        # (This check is hard in operator macro style, assume yes if vg has verts)
        
        # Separate
        try:
            bpy.ops.mesh.separate(type='SELECTED')
        except RuntimeError:
            # Nothing selected?
            continue
            
        # Back to Object Mode to rename the new object
        bpy.ops.object.mode_set(mode='OBJECT')
        
        # The separated object is usually the selected one? 
        # 'separate' keeps original active, new part is selected.
        selected = bpy.context.selected_objects
        # Brain_Full is active. The new object is in selected.
        new_obj = None
        for obj in selected:
            if obj != original_obj:
                new_obj = obj
                break
        
        if new_obj:
            new_obj.name = region_name
            # Clear vertex groups on the new object to save space? Optional.
            original_obj.select_set(False) # Deselect original for next loop? 
            # Actually we need original to be active for next separate
            bpy.context.view_layer.objects.active = original_obj
            original_obj.select_set(True)

    # 4. Save
    print(f"Saving to {output_blend_path}...")
    bpy.ops.wm.save_as_mainfile(filepath=output_blend_path)
    print("Segmentation Complete.")

if __name__ == "__main__":
    # Args: -- <fbx_path> <json_path> <output_blend_path>
    try:
        args = sys.argv[sys.argv.index("--") + 1:]
    except ValueError:
        args = []
        
    if len(args) < 3:
        # Defaults for testing
        script_dir = os.path.dirname(os.path.abspath(__file__))
        fbx = os.path.join(script_dir, "brain.fbx")
        js = os.path.join(os.path.dirname(script_dir), "python", "regions_pred.json")
        out = os.path.join(script_dir, "brain_segmented.blend")
        segment_brain(fbx, js, out)
    else:
        segment_brain(args[0], args[1], args[2])

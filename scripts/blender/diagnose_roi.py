
import bpy
import os
import sys
import bmesh

# Add script dir to path
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.append(script_dir)

import custom_animation as custom_anim
import neuron_physics
import visual_effects

def diag_roi_mesh():
    print("\n--- ROI Mesh Integrity Diagnostic ---")
    
    # Setup
    for obj in bpy.data.objects:
        bpy.data.objects.remove(obj, do_unlink=True)
        
    fbx = os.path.join(script_dir, "brain.fbx")
    bpy.ops.import_scene.fbx(filepath=fbx)
    brain = bpy.context.selected_objects[0]
    brain.name = "BrainModel"
    
    # Run the exact protocol for one ROI
    DATA_DIR = os.path.join(script_dir, '..', 'python')
    REGION_MAP_FILE = os.path.join(DATA_DIR, "region_map.json")
    VERTICES_FILE = os.path.join(DATA_DIR, "vertices.npy")
    LABELS_FILE = os.path.join(DATA_DIR, "labels.npy")
    
    label = "Field CA1"
    center, indices = custom_anim.get_region_data(label, REGION_MAP_FILE, LABELS_FILE, VERTICES_FILE)
    
    # 1. Duplicate
    bpy.ops.object.select_all(action='DESELECT')
    brain.select_set(True)
    bpy.context.view_layer.objects.active = brain
    bpy.ops.object.duplicate()
    h_obj = bpy.context.active_object
    
    # 2. Select Verts (Protocol Step A)
    bm = bmesh.new()
    bm.from_mesh(h_obj.data)
    bm.verts.ensure_lookup_table()
    for v in bm.verts:
        v.select = False
    for idx in indices:
        if idx < len(bm.verts):
            bm.verts[idx].select = True
            
    # 3. Delete Non-ROI (Protocol Step C)
    # Instead of Edit Mode, use bmesh in Object Mode for more stability
    to_delete = [v for v in bm.verts if not v.select]
    bmesh.ops.delete(bm, geom=to_delete, context='VERTS')
    bm.to_mesh(h_obj.data)
    bm.free()
    h_obj.data.update()
    
    print(f"Isolated ROI Vert Count: {len(h_obj.data.vertices)}")
    
    # 4. Material
    visual_effects.apply_textured_highlight(h_obj)
    
    # 5. Check Mesh Integrity
    print(f"Checking for mesh errors on {h_obj.name}...")
    if any(not v.co.is_frozen for v in h_obj.data.vertices): # check for bad coords
        print("Mesh coordinates look valid.")
        
    # Attempt a one-frame render to see if it segfaults here
    print("Attempting one-frame render of ROI...")
    bpy.context.scene.render.engine = 'BLENDER_WORKBENCH'
    bpy.context.scene.render.filepath = "/tmp/diag_render.png"
    # Ensure camera exists
    bpy.ops.object.camera_add(location=(0, -5, 0))
    bpy.context.scene.camera = bpy.context.active_object
    
    try:
        bpy.ops.render.render(write_still=True)
        print("Success: ROI rendered without segfault!")
    except Exception as e:
        print(f"FAILURE: Render crashed or errored: {e}")

if __name__ == "__main__":
    diag_roi_mesh()

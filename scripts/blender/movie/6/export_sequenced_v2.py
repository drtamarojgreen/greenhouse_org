import bpy
import os

def export_assets_explicitly():
    """
    Exports spirit ensemble with strict 1:1 mapping between FBX and Texture.
    Uses internal data-blocks instead of file system assumptions.
    """
    export_dir = os.path.join(os.path.dirname(bpy.data.filepath), "assets")
    os.makedirs(export_dir, exist_ok=True)
    
    # Target characters by their rig names in the manifest
    # This list corresponds to the 8 spirits we have verified
    spirits = [
        "Sylvan_Majesty.Rig", "Radiant_Aura.Rig", "Verdant_Sprite.Rig", 
        "Shadow_Weaver.Rig", "Emerald_Sentinel.Rig", "Phoenix_Herald.Rig", 
        "Golden_Phoenix.Rig", "Root_Guardian.Rig"
    ]
    
    for i, rig_name in enumerate(spirits, 1):
        idx_str = f"{i:04d}"
        fbx_path = os.path.join(export_dir, f"{idx_str}.fbx")
        
        rig = bpy.data.objects.get(rig_name)
        if not rig:
            print(f"  WARNING: Could not find {rig_name}, skipping...")
            continue
            
        # 1. Prepare asset
        bpy.ops.object.select_all(action='DESELECT')
        rig.select_set(True)
        for child in rig.children_recursive:
            child.select_set(True)
        bpy.context.view_layer.objects.active = rig
        
        # 2. Force texture packing into internal blend data
        for mat in bpy.data.materials:
            for node in mat.node_tree.nodes:
                if node.type == 'TEX_IMAGE' and node.image:
                    # Ensure image is packed internally
                    if not node.image.packed_file:
                        node.image.pack()
        
        # 3. Export
        print(f"Exporting: {rig_name} -> {idx_str}.fbx")
        bpy.ops.export_scene.fbx(
            filepath=fbx_path,
            use_selection=True,
            path_mode='COPY',
            embed_textures=True
        )

if __name__ == "__main__":
    export_assets_sequentially = export_assets_explicitly
    export_assets_sequentially()

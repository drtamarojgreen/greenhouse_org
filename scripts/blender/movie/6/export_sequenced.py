import bpy
import os

def export_assets_sequentially():
    """
    Exports spirit ensemble from the current .blend file.
    Assumes objects are named according to manifest/config and textures are packed.
    """
    export_dir = os.path.join(os.path.dirname(bpy.data.filepath), "assets")
    os.makedirs(export_dir, exist_ok=True)
    
    # Get all potential spirit root objects (Rig or Mesh)
    # Filter for objects that look like spirit characters
    spirit_objects = [o for o in bpy.data.objects if o.parent is None and ("Mesh" in o.name or "Armature" in o.name or "Spirit" in o.name)]
    
    # Sort them to maintain consistent naming
    spirit_objects.sort(key=lambda x: x.name)
    
    for i, obj in enumerate(spirit_objects, 1):
        idx_str = f"{i:04d}"
        fbx_name = f"{idx_str}.fbx"
        fbx_path = os.path.join(export_dir, fbx_name)
        
        # 1. Unpack Textures for this asset
        # We target objects associated with this spirit
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        for child in obj.children_recursive:
            child.select_set(True)
            
        # Unpack only used images
        bpy.ops.file.unpack_all(method='USE_LOCAL')
        
        # 2. Export FBX with textures embedded
        print(f"Exporting: {obj.name} -> {fbx_name}")
        bpy.ops.export_scene.fbx(
            filepath=fbx_path,
            use_selection=True,
            path_mode='COPY',
            embed_textures=True
        )
        
        # 3. Rename/Verify textures (Assuming they were unpacked to a local /textures/ folder)
        # We look for the newest png/jpg in the export dir to map to our index
        for f in os.listdir(export_dir):
            if f.endswith(('.png', '.jpg', '.jpeg')) and idx_str not in f:
                # Rename to match FBX
                new_tex_name = f"{idx_str}{os.path.splitext(f)[1]}"
                os.rename(os.path.join(export_dir, f), os.path.join(export_dir, new_tex_name))
                print(f"  Renamed texture to: {new_tex_name}")

if __name__ == "__main__":
    export_assets_sequentially()

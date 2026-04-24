import bpy
import os

def audit_fbx_rigging():
    """
    Imports each exported FBX and checks:
    1. Does an armature exist?
    2. Is the mesh parented to it?
    3. Are there active vertex groups (weights) for animation?
    """
    assets_dir = "/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/movie/6/assets"
    fbx_files = [f for f in os.listdir(assets_dir) if f.endswith(".fbx")]
    
    for fbx in fbx_files:
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.fbx(filepath=os.path.join(assets_dir, fbx))
        
        rig = next((o for o in bpy.data.objects if o.type == 'ARMATURE'), None)
        mesh = next((o for o in bpy.data.objects if o.type == 'MESH'), None)
        
        print(f"\n--- AUDIT: {fbx} ---")
        if rig:
            print(f"  Rig Found: {rig.name}")
            if mesh:
                is_parented = (mesh.parent == rig)
                has_weights = len(mesh.vertex_groups) > 0
                print(f"  Mesh: {mesh.name}")
                print(f"  Parented to rig: {is_parented}")
                print(f"  Deformation weights found: {has_weights} ({len(mesh.vertex_groups)} groups)")
            else:
                print("  ERROR: Mesh body missing in FBX.")
        else:
            print("  ERROR: Armature missing in FBX.")

if __name__ == "__main__":
    audit_fbx_rigging()

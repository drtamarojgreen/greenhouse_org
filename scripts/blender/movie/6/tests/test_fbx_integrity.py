import bpy
import os

def audit_fbx_content(fbx_path):
    print(f"\n--- AUDIT: {os.path.basename(fbx_path)} ---")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    try:
        bpy.ops.import_scene.fbx(filepath=fbx_path)
    except Exception as e:
        print(f"Failed to import: {e}")
        return

    rigs = [o for o in bpy.data.objects if o.type == 'ARMATURE']
    meshes = [o for o in bpy.data.objects if o.type == 'MESH']
    
    print(f"Armatures found: {[r.name for r in rigs]}")
    print(f"Meshes found: {[m.name for m in meshes]}")
    
    for m in meshes:
        print(f"Mesh {m.name} parent: {m.parent.name if m.parent else 'None'}")
        print(f"Modifiers: {[mod.type for mod in m.modifiers]}")

if __name__ == "__main__":
    audit_fbx_content("/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/movie/6/assets/0001.fbx")

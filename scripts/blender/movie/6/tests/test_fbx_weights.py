import bpy
import os

def audit_fbx_weights(assets_dir):
    fbx_files = [f for f in os.listdir(assets_dir) if f.endswith(".fbx")]
    
    for fbx in fbx_files:
        # Reset scene
        bpy.ops.wm.read_factory_settings(use_empty=True)
        
        # Import FBX
        fbx_path = os.path.join(assets_dir, fbx)
        bpy.ops.import_scene.fbx(filepath=fbx_path)
        
        # Find mesh
        mesh = next((o for o in bpy.data.objects if o.type == 'MESH'), None)
        if not mesh:
            print(f"FAILED: No mesh in {fbx}")
            continue
            
        # Verify vertex groups
        print(f"\n--- WEIGHT AUDIT: {fbx} ---")
        print(f"Vertex Groups found: {[vg.name for vg in mesh.vertex_groups]}")
        
        # Check first 5 vertices for weights
        for i, v in enumerate(mesh.data.vertices[:5]):
            weights = [(mesh.vertex_groups[g.group].name, g.weight) for g in v.groups]
            print(f"  Vertex {i}: Weights {weights}")

if __name__ == "__main__":
    assets_dir = "/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/movie/6/assets"
    audit_fbx_weights(assets_dir)

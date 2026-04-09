import bpy
import os
import json
import mathutils

EQUIPMENT_DIR = "/home/tamarojgreen/Documents/Movie_Equipment/"
MANIFEST_PATH = os.path.join(os.path.dirname(__file__), "asset_manifest.json")

def patch_fbx_importer():
    """Bypasses 'AttributeError: ImportFBX object has no attribute files' in headless mode."""
    try:
        import sys
        fbx_module = sys.modules.get('io_scene_fbx')
        if not fbx_module:
            try: import io_scene_fbx; fbx_module = io_scene_fbx
            except ImportError: pass
        if fbx_module and hasattr(fbx_module, 'ImportFBX'):
            ImportFBX = fbx_module.ImportFBX
            if not getattr(ImportFBX, '_is_patched', False):
                original_execute = ImportFBX.execute
                def patched_execute(self, context):
                    if not hasattr(self, 'files'): self.files = []
                    return original_execute(self, context)
                ImportFBX.execute = patched_execute; ImportFBX._is_patched = True
                return True
    except: pass
    return False

def get_poly_count(obj):
    if obj.type != 'MESH': return 0
    return len(obj.data.polygons)

def analyze_blend(filepath):
    results = {"armatures": {}, "actions": [], "materials": [], "meshes": []}
    print(f"  Deep Inspecting Blend: {os.path.basename(filepath)}...")
    
    # We use libraries.load to see names, then link specific objects to see details
    try:
        # 1. Inspect data-block names
        with bpy.data.libraries.load(filepath) as (data_from, data_to):
            results["actions"] = data_from.actions
            results["materials"] = data_from.materials
            results["meshes"] = data_from.meshes
            results["object_names"] = data_from.objects

        # 2. Link Armatures to see bones
        bpy.ops.wm.read_factory_settings(use_empty=True)
        with bpy.data.libraries.load(filepath, link=True) as (data_from, data_to):
            # Find objects that look like armatures
            target_objs = [o for o in data_from.objects if "Armature" in o or "Rig" in o or "MHD" in o]
            data_to.objects = target_objs
        
        for obj in bpy.data.objects:
            if obj.type == 'ARMATURE':
                results["armatures"][obj.name] = {
                    "bones": [b.name for b in obj.data.bones],
                    "bone_count": len(obj.data.bones)
                }
            elif obj.type == 'MESH':
                 results["meshes"].append({
                     "name": obj.name,
                     "poly_count": get_poly_count(obj)
                 })
    except Exception as e:
        results["error"] = str(e)
    return results

def analyze_fbx(filepath):
    print(f"  Performing FBX Inspection on {os.path.basename(filepath)}...")
    patch_fbx_importer()
    bpy.ops.wm.read_factory_settings(use_empty=True)
    try:
        # Headless import often needs manual file entry if patch fails for some reason
        bpy.ops.import_scene.fbx(filepath=filepath)
        data = {"objects": []}
        for obj in bpy.context.scene.objects:
            info = {
                "name": obj.name,
                "type": obj.type,
                "poly_count": get_poly_count(obj) if obj.type == 'MESH' else 0,
                "materials": [m.name for m in obj.data.materials if m] if obj.type == 'MESH' else []
            }
            if obj.type == 'ARMATURE':
                info["bones"] = [b.name for b in obj.data.bones]
            data["objects"].append(info)
        return data
    except Exception as e:
        return {"error": str(e)}

def main():
    print("\n" + "="*50)
    print("V6 ASSET INSPECTION REPORT (PATCHED)")
    print("="*50)
    
    manifest = {"blends": {}, "fbxs": {}}
    files = os.listdir(EQUIPMENT_DIR)
    
    for f in sorted(files):
        path = os.path.join(EQUIPMENT_DIR, f)
        if f.endswith(".blend"):
            print(f"\n[BLEND] {f}")
            data = analyze_blend(path)
            manifest["blends"][f] = data
            if "armatures" in data:
                for name, info in data["armatures"].items():
                    print(f"  - Armature: {name} ({info['bone_count']} bones)")
                    print(f"    Sample Bones: {info['bones'][:10]}...")
            print(f"  Actions: {len(data.get('actions', []))}")
            
        elif f.endswith(".fbx"):
            print(f"\n[FBX] {f}")
            data = analyze_fbx(path)
            manifest["fbxs"][f] = data
            if "error" in data:
                print(f"  ERROR: {data['error']}")
            else:
                for obj in data.get("objects", []):
                    print(f"  - {obj['name']} ({obj['type']})")
                    if obj.get("bones"):
                        print(f"    Bones ({len(obj['bones'])}): {obj['bones'][:5]}...")

    with open(MANIFEST_PATH, "w") as f:
        json.dump(manifest, f, indent=4)
    print(f"\nManifest saved to: {MANIFEST_PATH}")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()

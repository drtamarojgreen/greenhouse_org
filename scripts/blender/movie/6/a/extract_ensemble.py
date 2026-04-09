import bpy
import os
import sys

# Ensure v6 is in path
V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if V6_DIR not in sys.path: sys.path.append(V6_DIR)

import config
from asset_manager_v6 import SylvanEnsembleManager

def extract_assets():
    print("\n" + "="*80)
    print("PHASE A: ASSET EXTRACTION (Sylvan Ensemble)")
    print("="*80)
    
    manager = SylvanEnsembleManager()
    
    # 1. Clean Initialization
    manager.ensure_clean_slate()
    
    # 2. Link Ensemble
    manager.link_ensemble()
    
    # 3. Passive Renaming (No scaling or geometric modification)
    print("ASSET_MANAGER: Renaming assets for export...")
    for src_mesh, art_name in manager.ensemble.items():
        mesh_obj = bpy.data.objects.get(src_mesh)
        if not mesh_obj: continue
        
        # Determine separater based on protagonist status (legacy alignment)
        sep = "_" if art_name in [config.CHAR_HERBACEOUS, config.CHAR_ARBOR] else "."
        mesh_obj.name = f"{art_name}{sep}Body"
        
        src_rig = manager.rig_map.get(art_name)
        rig_obj = bpy.data.objects.get(src_rig) if src_rig else mesh_obj.find_armature()
        if rig_obj:
            rig_obj.name = f"{art_name}{sep}Rig"

    # 4. Export to FBX
    asset_dir = os.path.join(V6_DIR, "assets")
    os.makedirs(asset_dir, exist_ok=True)
    
    print(f"\nEXPORTING TO: {asset_dir}")
    for art_name in manager.ensemble.values():
        body_name = f"{art_name}.Body" if art_name not in [config.CHAR_HERBACEOUS, config.CHAR_ARBOR] else f"{art_name}_Body"
        rig_name = f"{art_name}.Rig" if art_name not in [config.CHAR_HERBACEOUS, config.CHAR_ARBOR] else f"{art_name}_Rig"
        
        body = bpy.data.objects.get(body_name)
        rig = bpy.data.objects.get(rig_name)
        
        if body and rig:
            # Select both
            bpy.ops.object.select_all(action='DESELECT')
            body.select_set(True)
            rig.select_set(True)
            bpy.context.view_layer.objects.active = rig
            
            fbx_path = os.path.join(asset_dir, f"{art_name}.fbx")
            bpy.ops.export_scene.fbx(
                filepath=fbx_path,
                use_selection=True,
                apply_unit_scale=False, # Maintain raw scale
                bake_anim=False # We link original blends for anim usually, but FBX is for structural stability
            )
            print(f"SUCCESS: Exported {art_name} -> {fbx_path}")

    # 5. Extract Textures (Unpack generic materials)
    # Note: In our pipeline, textures are usually in DOCUMENTS. We'll ensure they are copied or accessible.
    print("\nPHASE A: Complete.")

if __name__ == "__main__":
    extract_assets()

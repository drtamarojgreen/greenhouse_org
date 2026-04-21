import bpy
import os
import sys
from ..config import config
from ..asset_manager import AssetManager

def run_extraction():
    print("PHASE A: MODULAR ASSET EXTRACTION")
    manager = AssetManager()
    manager.clear_scene()

    entities = config.get("ensemble.entities", [])
    blend_path = config.assets_blend

    # Collect all required source objects
    targets = []
    for ent in entities:
        if ent.get("source_mesh"): targets.append(ent["source_mesh"])
        if ent.get("source_rig"): targets.append(ent["source_rig"])

    print(f"Linking {len(targets)} objects from {blend_path}...")
    manager.link_assets(blend_path, targets)

    # Process and Export
    output_dir = config.output_dir
    os.makedirs(output_dir, exist_ok=True)

    for ent in entities:
        ent_id = ent["id"]
        mesh_src = ent.get("source_mesh")
        rig_src = ent.get("source_rig")

        mesh_obj = bpy.data.objects.get(mesh_src) if mesh_src else None
        rig_obj = bpy.data.objects.get(rig_src) if rig_src else None

        if rig_obj:
            manager.apply_standard_renaming(rig_obj, ent_id, is_rig=True)
            if ent.get("target_height"):
                manager.normalize_scale(rig_obj, ent["target_height"])

        if mesh_obj:
            manager.apply_standard_renaming(mesh_obj, ent_id, is_rig=False)

        # Export to FBX (minimal implementation for now)
        fbx_path = os.path.join(output_dir, f"{ent_id}.fbx")
        bpy.ops.object.select_all(action='DESELECT')
        if rig_obj: rig_obj.select_set(True)
        if mesh_obj: mesh_obj.select_set(True)

        try:
            bpy.ops.export_scene.fbx(filepath=fbx_path, use_selection=True)
            print(f"Exported {ent_id} to {fbx_path}")
        except Exception as e:
            print(f"Failed to export {ent_id}: {e}")

if __name__ == "__main__":
    run_extraction()

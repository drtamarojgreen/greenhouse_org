import bpy
import os
import sys

# Ensure parent directory is in path for direct execution
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

import config
import components
from asset_manager import AssetManager
from character_builder import CharacterBuilder

def run_extraction():
    print("PHASE A: OO MODULAR ASSET EXTRACTION")
    components.initialize_registry()
    manager = AssetManager(); manager.clear_scene()
    entities = config.config.get("ensemble.entities", [])
    output_dir = config.config.output_dir
    os.makedirs(output_dir, exist_ok=True)

    for ent_cfg in entities:
        char = CharacterBuilder.create(ent_cfg["id"], ent_cfg)
        char.build(manager)
        fbx_path = os.path.join(output_dir, f"{ent_cfg['id']}.fbx")
        bpy.ops.object.select_all(action='DESELECT')
        if char.rig: char.rig.select_set(True)
        if char.mesh: char.mesh.select_set(True)
        # Select children for export
        if char.rig:
            for c in char.rig.children_recursive: c.select_set(True)

        if char.rig or char.mesh:
            try:
                bpy.ops.export_scene.fbx(filepath=fbx_path, use_selection=True)
                print(f"Exported {ent_cfg['id']}")
            except Exception as e: print(f"Failed {ent_cfg['id']}: {e}")

if __name__ == "__main__":
    run_extraction()

import bpy
import os
import sys

# Ensure Movie 7 root is in sys.path
M7_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M7_ROOT not in sys.path:
    sys.path.insert(0, M7_ROOT)

import config
from asset_manager import AssetManager
from character_builder import CharacterBuilder

def run_extraction():
    print("PHASE A: OO MODULAR ASSET EXTRACTION")
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
        for c in (char.rig.children_recursive if char.rig else []): c.select_set(True)
        if char.rig or char.mesh:
            try:
                bpy.ops.export_scene.fbx(filepath=fbx_path, use_selection=True)
                print(f"Exported {ent_cfg['id']}")
            except Exception as e: print(f"Failed {ent_cfg['id']}: {e}")

if __name__ == "__main__":
    run_extraction()

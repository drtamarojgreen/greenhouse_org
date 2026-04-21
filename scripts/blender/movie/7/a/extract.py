import bpy
import os
import sys

# Ensure parent directory is in path for direct execution
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

try:
    from config import config
    from asset_manager import AssetManager
    from character_builder import CharacterBuilder
except ImportError:
    from ..config import config
    from ..asset_manager import AssetManager
    from ..character_builder import CharacterBuilder

def run_extraction():
    print("PHASE A: OO MODULAR ASSET EXTRACTION")
    manager = AssetManager()
    manager.clear_scene()

    entities = config.get("ensemble.entities", [])
    output_dir = config.output_dir
    os.makedirs(output_dir, exist_ok=True)

    for ent_cfg in entities:
        char_id = ent_cfg["id"]
        char = CharacterBuilder.create(char_id, ent_cfg)
        char.build(manager)

        # Export to FBX
        fbx_path = os.path.join(output_dir, f"{char_id}.fbx")
        bpy.ops.object.select_all(action='DESELECT')
        if char.rig: char.rig.select_set(True)
        if char.mesh: char.mesh.select_set(True)

        if char.rig or char.mesh:
            try:
                bpy.ops.export_scene.fbx(filepath=fbx_path, use_selection=True)
                print(f"Exported {char_id} to {fbx_path}")
            except Exception as e:
                print(f"Failed to export {char_id}: {e}")

if __name__ == "__main__":
    run_extraction()

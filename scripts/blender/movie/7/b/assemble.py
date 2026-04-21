import bpy
import os
import sys

# Ensure parent directory is in path for direct execution
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

try:
    from config import config
    from director import Director
    from asset_manager import AssetManager
    from character_builder import CharacterBuilder
except ImportError:
    from ..config import config
    from ..director import Director
    from ..asset_manager import AssetManager
    from ..character_builder import CharacterBuilder

def run_assembly():
    print("PHASE B: OO SCENE ASSEMBLY (Registered Components)")
    director, manager = Director(), AssetManager()
    manager.clear_scene()
    director.setup_environment(); director.setup_lighting(); director.setup_cameras()

    for ent_cfg in config.get("ensemble.entities", []):
        char = CharacterBuilder.create(ent_cfg["id"], ent_cfg)
        char.build(manager)
        char.apply_pose()
        if char.animator:
            char.animator.apply_action(char.rig, "idle", 1, ent_cfg.get("parameters", {}))

    bpy.context.view_layer.update()
    print("SUCCESS: Movie 7 Scene Assembled.")

if __name__ == "__main__":
    run_assembly()

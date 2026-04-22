import bpy
import math
import os
import sys

# Ensure Movie 7 root is in sys.path
M7_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M7_ROOT not in sys.path:
    sys.path.insert(0, M7_ROOT)

import config
import components
from director import Director
from asset_manager import AssetManager
from character_builder import CharacterBuilder

def run_assembly():
    print("PHASE B: OO SCENE ASSEMBLY")
    components.initialize_registry()
    director, manager = Director(), AssetManager(); manager.clear_scene()
    director.setup_environment(); director.setup_lighting(); director.setup_cameras()

    for ent_cfg in config.config.get("ensemble.entities", []):
        char = CharacterBuilder.create(ent_cfg["id"], ent_cfg)
        char.build(manager)
        char.apply_pose()
        if char.animator:
            char.animate("idle", 1)

    bpy.context.view_layer.update(); print("SUCCESS: Movie 7 Scene Assembled.")

if __name__ == "__main__":
    run_assembly()

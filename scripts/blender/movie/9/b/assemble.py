import bpy
import math
import os
import sys
import json
import config

# Ensure Movie 9 root is in sys.path
M9_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if M9_ROOT not in sys.path:
    sys.path.insert(0, M9_ROOT)

from director import Director
from asset_manager import AssetManager
from character_builder import CharacterBuilder
import components

def run_assembly():
    """
    Production scene assembly for Movie 9.
    Architecture Kept: The phased assembly pattern allows for iterative
    refinement of scene composition without re-running the full extraction,
    matching the professional-grade workflow requirements.
    """
    print("PHASE B: OO SCENE ASSEMBLY")
    components.initialize_registry()
    director, manager = Director(), AssetManager(); manager.clear_scene()

    # 1. Environment Build
    from registry import registry
    ext_modeler_cls = registry.get_modeling("ExteriorModeler")
    if ext_modeler_cls:
        ext_modeler = ext_modeler_cls()
        ext_modeler.build_mesh("Environment", config.config.get("environment", {}))

    backdrop_modeler_cls = registry.get_modeling("BackdropModeler")
    if backdrop_modeler_cls:
        backdrop_modeler = backdrop_modeler_cls()
        backdrop_modeler.build_mesh("Chroma", config.config.get("chroma", {}))

    # 2. Cinematics & Lighting
    director.setup_lighting()
    director.setup_cinematics()
    director.apply_sequencing()

    # 3. Characters
    entities = config.config.get("ensemble.entities", [])
    for ent_cfg in entities:
        char = CharacterBuilder.create(ent_cfg["id"], ent_cfg)
        char.build(manager)
        char.apply_pose()
        if char.animator:
            char.animate("idle", 1)

    # 4. Refinements & Storyline
    director.compose_ensemble()
    director.position_protagonists()
    director.apply_storyline()

    bpy.context.view_layer.update(); print("SUCCESS: Movie 9 Scene Assembled.")

if __name__ == "__main__":
    run_assembly()

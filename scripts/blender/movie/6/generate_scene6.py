import bpy
import os
import sys
import time

# Ensure movie root and v6 are in path
V6_DIR = os.path.dirname(os.path.abspath(__file__))
MOVIE_ROOT = os.path.dirname(V6_DIR)
if MOVIE_ROOT not in sys.path: sys.path.append(MOVIE_ROOT)
if V6_DIR not in sys.path: sys.path.append(V6_DIR)

import config
from director_v6 import SylvanDirector
from asset_manager_v6 import SylvanEnsembleManager
from chroma_green_setup import setup_chroma_green_backdrop
from assets_v6.plant_humanoid_v6 import create_plant_humanoid_v5

def generate_full_scene_v6():
    """Direct master production assembly for Scene 6."""
    start_t = time.time()
    
    # 1. Clean Slate
    manager = SylvanEnsembleManager()
    manager.ensure_clean_slate()
    
    # 2. Setup Backdrop
    setup_chroma_green_backdrop()

    # 3. Create Protagonists (Procedural v6)
    # Using v5-standard base locations
    HERB_BASE = (-1.75, -0.3, 0.0)
    ARBOR_BASE = (1.75, 0.3, 0.0)

    print(f"ASSET_MANAGER: Generating Protagonists (Procedural)...")
    create_plant_humanoid_v5(config.CHAR_HERBACEOUS, HERB_BASE)
    create_plant_humanoid_v5(config.CHAR_ARBOR, ARBOR_BASE)

    # 4. Link Spirit Ensemble
    manager.link_ensemble()
    manager.repair_materials()

    # 5. Cinematic Setup
    director = SylvanDirector()
    director.compose_ensemble()     # Spirit placement
    director.setup_cinematics()    # Camera rig
    
    bpy.context.view_layer.update()
    print(f"SUCCESS: Scene 6 assembled in {time.time() - start_t:.2f}s")

if __name__ == "__main__":
    generate_full_scene_v6()

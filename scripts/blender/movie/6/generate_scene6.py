"""
Scene 6 Generator
=================
v5 foundation (identical camera + backdrop setup) plus Sylvan Ensemble
imported from the production blend file.
"""

import bpy
import math
import mathutils
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

def generate_full_scene_v6():
    """Direct assembly sequence for Scene 6."""
    start_t = time.time()
    
    # 1. Clean Slate
    manager = SylvanEnsembleManager()
    manager.ensure_clean_slate()
    
    # 2. Setup Backdrop
    setup_chroma_green_backdrop()

    # 3. Link Spirits
    manager.link_ensemble()
    manager.repair_materials()

    # 4. Cinematic Setup
    director = SylvanDirector()
    director.position_protagonists()
    director.compose_ensemble()
    director.setup_cinematics()
    
    bpy.context.view_layer.update()
    print(f"SUCCESS: Scene 6 assembled in {time.time() - start_t:.2f}s")

if __name__ == "__main__":
    generate_full_scene_v6()

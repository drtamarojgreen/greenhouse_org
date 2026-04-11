import bpy
import os
import sys

# prioritize movie/6 and assets_v6 for absolute imports
V6_DIR = os.path.dirname(os.path.abspath(__file__))
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)

ASSETS_V6_DIR = os.path.join(V6_DIR, "assets_v6")
if ASSETS_V6_DIR not in sys.path: sys.path.insert(0, ASSETS_V6_DIR)

# Prioritize movie/ for style_utilities
MOVIE_DIR = os.path.dirname(V6_DIR)
if MOVIE_DIR not in sys.path: sys.path.insert(0, MOVIE_DIR)

import config
import plant_humanoid_v6
import asset_manager_v6
import director_v6
import camera_rig_v6
import chroma_green_setup

# --- COORDINATE CONSTANTS (production requirements) ---
HERB_BASE = (-1.75, -0.3, 0.0)
ARBOR_BASE = (1.75, 0.3, 0.0)
HERB_EYE_LEVEL = (-1.75, -0.3, 2.5)
ARBOR_EYE_LEVEL = (1.75, 0.3, 2.5)

def standardize_ensemble_heights():
    """No-op shim."""
    print("ASSET_MANAGER: Normalizing Ensemble Heights [SKIPPED]")
    pass

def generate_full_scene_v6():
    """Master production assembly."""
    import time
    start_t = time.time()

    am = asset_manager_v6.SylvanEnsembleManager()
    am.ensure_clean_slate()

    chroma_green_setup.setup_chroma_green_backdrop()

    plant_humanoid_v6.create_plant_humanoid_v6(config.CHAR_HERBACEOUS, HERB_BASE)
    plant_humanoid_v6.create_plant_humanoid_v6(config.CHAR_ARBOR, ARBOR_BASE)

    am.link_ensemble()
    am.renormalize_objects()

    dv6 = director_v6.SylvanDirector()
    dv6.setup_cinematics() # Build standard 3-camera rig
    dv6.position_protagonists()
    dv6.compose_ensemble()

    # Apply dynamic paths to cameras created by director
    camera_rig_v6.setup_camera_rig_v6()

    bpy.context.view_layer.update()
    print(f"SUCCESS: Scene 6 assembled in {time.time() - start_t:.2f}s")

if __name__ == "__main__":
    generate_full_scene_v6()

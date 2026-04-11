import bpy
import math
import mathutils
import os
import sys
import time
import config

# Setup paths to access v5 assets and shared utilities
V6_DIR = os.path.dirname(os.path.abspath(__file__))
V5_DIR = os.path.join(os.path.dirname(V6_DIR), "5")
MOVIE_ROOT = os.path.dirname(V6_DIR) # scripts/blender/movie
BLENDER_ROOT = os.path.dirname(MOVIE_ROOT) # scripts/blender

for p in [V5_DIR, MOVIE_ROOT, BLENDER_ROOT]:
    if p not in sys.path:
        sys.path.append(p)

from assets_v5.plant_humanoid_v5 import create_plant_humanoid_v5, setup_production_lighting
from asset_manager_v6 import SylvanEnsembleManager
from director_v6 import SylvanDirector
from dialogue_scene_v6 import DialogueSceneV6
from chroma_green_setup import setup_chroma_green_backdrop


def generate_full_scene_v6():
    """Master production assembly for Scene 6, using reliable v5 core logic."""
    start_t = time.time()
    try:
        # 0. THE SCORCHED-EARTH PURGE (from v5)
        print("PURGE: Removing all persistent data blocks...")
        for coll in list(bpy.data.collections):
            for obj in list(coll.objects):
                coll.objects.unlink(obj)

        for block in [bpy.data.objects, bpy.data.meshes, bpy.data.cameras,
                      bpy.data.lights, bpy.data.materials, bpy.data.actions, bpy.data.worlds]:
            for item in list(block):
                try:
                    block.remove(item, do_unlink=True)
                except Exception as e:
                    print(f"PURGE WARNING: Could not remove {item.name}: {e}")

        # Confirm units are standard
        bpy.context.scene.unit_settings.system = 'METRIC'
        bpy.context.scene.unit_settings.scale_length = 1.0

        # 1. Base structure (chroma backdrop + world)
        backdrop = setup_chroma_green_backdrop()
        print(f"ENV: Backdrop '{backdrop.name if backdrop else 'FAILED'}' ready.")

        # 2. Asset Generation (Humanoid V5)
        # We use v5's procedural generation for protagonists
        create_plant_humanoid_v5(config.CHAR_HERBACEOUS, config.CHAR_HERBACEOUS_POS)
        create_plant_humanoid_v5(config.CHAR_ARBOR, config.CHAR_ARBOR_POS)

        # 3. Ensemble & Sylvan spirits
        asset_manager = SylvanEnsembleManager()
        asset_manager.link_ensemble()
        asset_manager.renormalize_objects()
        # asset_manager.repair_materials() # Optional

        # 4. Cinematic direction & Cameras
        director = SylvanDirector()
        director.position_protagonists()
        director.compose_ensemble()
        director.setup_cinematics()

        # Final view layer update to sync all transforms
        bpy.context.view_layer.update()

        print(f"SUCCESS: Scene 6 assembled in {time.time() - start_t:.2f}s")

    except Exception as e:
        import traceback
        print(f"CRITICAL: Assembly failed: {e}")
        traceback.print_exc()


if __name__ == "__main__":
    generate_full_scene_v6()

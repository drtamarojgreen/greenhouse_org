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
import chroma_green_setup
import animation_library_v6 as anim

def generate_full_scene_v6():
    """Master production assembly with varied performances."""
    import time
    start_t = time.time()

    am = asset_manager_v6.SylvanEnsembleManager()
    am.ensure_clean_slate()

    chroma_green_setup.setup_chroma_green_backdrop()

    herb = plant_humanoid_v6.create_plant_humanoid_v6(config.CHAR_HERBACEOUS, config.CHAR_HERBACEOUS_POS)
    arbor = plant_humanoid_v6.create_plant_humanoid_v6(config.CHAR_ARBOR, config.CHAR_ARBOR_POS)

    am.link_ensemble()
    am.renormalize_objects()

    dv6 = director_v6.SylvanDirector()
    dv6.setup_cinematics()
    dv6.position_protagonists()
    dv6.compose_ensemble()

    # Apply Varied Performances
    for obj in bpy.data.objects:
        if obj.type == 'ARMATURE':
            tag = config.PERFORMANCES.get(obj.name, "spirit_dance")
            # For ensemble members which might be renamed with suffixes, try base name
            if tag == "spirit_dance" and "." in obj.name:
                base_n = obj.name.split(".")[0]
                tag = config.PERFORMANCES.get(base_n, "spirit_dance")

            anim.apply_animation_by_tag(obj, tag, 1, duration=config.TOTAL_FRAMES)

            # Ambient Blinking for plant characters
            if "Herbaceous" in obj.name or "Arbor" in obj.name:
                anim.apply_animation_by_tag(obj, "blink", 1, duration=config.TOTAL_FRAMES)

    bpy.context.view_layer.update()
    print(f"SUCCESS: Scene 6 assembled with performing ensemble in {time.time() - start_t:.2f}s")

if __name__ == "__main__":
    generate_full_scene_v6()

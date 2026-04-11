import bpy
import os
import time
import config

from asset_manager_v6 import SylvanEnsembleManager
from director_v6 import SylvanDirector
from chroma_green_setup import setup_chroma_green_backdrop


def generate_full_scene_v6():
    """Master production assembly for Scene 6."""
    start_t = time.time()
    try:
        # 0. THE SCORCHED-EARTH PURGE (from v5 logic)
        print("PURGE: Removing all persistent data blocks...")
        for coll in list(bpy.data.collections):
            for obj in list(coll.objects):
                coll.objects.unlink(obj)

        for block in [bpy.data.objects, bpy.data.meshes, bpy.data.armatures,
                      bpy.data.cameras, bpy.data.lights, bpy.data.materials,
                      bpy.data.actions, bpy.data.worlds, bpy.data.images]:
            for item in list(block):
                try:
                    block.remove(item, do_unlink=True)
                except Exception:
                    pass

        # Ensure units are standard
        bpy.context.scene.unit_settings.system = 'METRIC'
        bpy.context.scene.unit_settings.scale_length = 1.0

        director = SylvanDirector()

        # 1. Base structure (chroma backdrop + world)
        backdrop = setup_chroma_green_backdrop()
        print(f"ENV: Backdrop '{backdrop.name if backdrop else 'FAILED'}' ready.")

        # 2. Ensemble & protagonists
        asset_manager = SylvanEnsembleManager()
        asset_manager.link_protagonists()
        asset_manager.link_ensemble()

        # 3. Clean renaming and Parent-Child setup
        asset_manager.renormalize_objects()

        # 4. Cinematic direction
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

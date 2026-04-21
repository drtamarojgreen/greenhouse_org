import bpy
import os
from ..config import config
from ..director import Director
from ..asset_manager import AssetManager
from ..character_builder import CharacterBuilder

def run_assembly():
    print("PHASE B: OO MODULAR SCENE ASSEMBLY")

    director = Director()
    manager = AssetManager()
    manager.clear_scene()

    director.setup_environment()
    director.setup_lighting()
    director.setup_cameras()

    entities = config.get("ensemble.entities", [])

    for ent_cfg in entities:
        char_id = ent_cfg["id"]
        ctype = ent_cfg.get("type", "MESH")

        if ctype == "DYNAMIC":
            # Build dynamic characters directly in the scene
            char = CharacterBuilder.create(char_id, ent_cfg)
            char.build(manager)
            char.apply_initial_pose()
            print(f"Built dynamic character: {char_id}")
        else:
            # Import mesh characters from FBX assets
            fbx_path = os.path.join(config.output_dir, f"{char_id}.fbx")
            if os.path.exists(fbx_path):
                bpy.ops.import_scene.fbx(filepath=fbx_path)
                print(f"Imported {char_id} from FBX")

                # Apply initial pose if defined in config
                rig = bpy.data.objects.get(f"{char_id}.Rig")
                if rig:
                    rig.location = ent_cfg.get("default_pos", (0,0,0))

    bpy.context.view_layer.update()
    print("Scene 7 Assembly Complete.")

if __name__ == "__main__":
    run_assembly()

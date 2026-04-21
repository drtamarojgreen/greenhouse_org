import bpy
import os
from ..config import config
from ..director import Director
from ..asset_manager import AssetManager

def run_assembly():
    print("PHASE B: MODULAR SCENE ASSEMBLY")

    director = Director()
    manager = AssetManager()

    manager.clear_scene()

    # 1. Setup Environment
    director.setup_environment()
    director.setup_lighting()
    director.setup_cameras()

    # 2. Link FBX Assets
    asset_dir = config.output_dir
    if os.path.exists(asset_dir):
        for file in os.listdir(asset_dir):
            if file.endswith(".fbx"):
                bpy.ops.import_scene.fbx(filepath=os.path.join(asset_dir, file))
                print(f"Imported {file}")

    # 3. Position Protagonists (if defined)
    protags = config.get("ensemble.protagonists", [])
    for p in protags:
        rig_name = f"{p['id']}.Rig"
        rig_obj = bpy.data.objects.get(rig_name)
        if rig_obj:
            rig_obj.location = p.get("default_pos", (0,0,0))
            print(f"Positioned {p['id']} at {rig_obj.location}")

    bpy.context.view_layer.update()
    print("Scene 7 Assembly Complete.")

if __name__ == "__main__":
    run_assembly()

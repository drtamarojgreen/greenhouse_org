import bpy
import os
import sys

# Add movie root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from silent_movie_generator import MovieMaster

def debug_render():
    master = MovieMaster(mode='SILENT_FILM')
    master.run()

    scene = master.scene
    scene.frame_set(850)

    print(f"--- Debug Render Info Frame 850 ---")
    print(f"Camera: {scene.camera.name} at {scene.camera.location}")
    print(f"Camera Rotation: {scene.camera.rotation_euler}")

    for obj in scene.objects:
        if not obj.hide_render:
            print(f"Visible Object: {obj.name} at {obj.location}")

    # Disable compositor for this test
    scene.use_nodes = False

    scene.render.filepath = "scripts/blender/movie/test/debug_no_comp_850.png"
    bpy.ops.render.render(write_still=True)
    print(f"Rendered to {scene.render.filepath}")

if __name__ == "__main__":
    debug_render()

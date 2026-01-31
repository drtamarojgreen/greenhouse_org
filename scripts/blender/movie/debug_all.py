import bpy
import os
import sys

# Add movie root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from silent_movie_generator import MovieMaster

def debug_all_frames():
    master = MovieMaster(mode='SILENT_FILM')
    master.run()

    scene = master.scene
    test_frames = [50, 850, 1700, 2300, 3250]

    # Enable compositor for these tests to see what the user sees
    scene.use_nodes = True

    for f in test_frames:
        scene.frame_set(f)
        print(f"\n--- Debug Info Frame {f} ---")
        print(f"Camera Loc: {scene.camera.location}")
        print(f"Camera Rot: {scene.camera.rotation_euler}")

        visible_count = 0
        for obj in scene.objects:
            if not obj.hide_render:
                visible_count += 1
                if visible_count < 10: # Don't spam
                    print(f"Visible: {obj.name} at {obj.location}")

        print(f"Total visible objects: {visible_count}")

        # Check Iris width/height
        tree = scene.node_tree
        iris = tree.nodes.get("IrisMask")
        if iris:
            print(f"Iris Mask: W={iris.width}, H={iris.height}")

        scene.render.filepath = f"scripts/blender/movie/test/debug_comp_{f}.png"
        bpy.ops.render.render(write_still=True)
        print(f"Rendered Frame {f} to {scene.render.filepath}")

if __name__ == "__main__":
    debug_all_frames()

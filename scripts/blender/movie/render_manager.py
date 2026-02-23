import bpy
import os
import sys

# Point 142: Ensure local modules are discoverable when run directly via blender --python
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.append(script_dir)

from constants import SCENE_MAP

def render_scene_batch(master, scene_names, output_dir="renders"):
    """Enhancement #90: Renders a batch of scenes specifically."""
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    master.load_assets()
    master.setup_lighting()
    master._setup_camera()
    master.setup_compositor()
    master._animate_characters()
    master._animate_props()
    master.animate_master()

    for name in scene_names:
        if name in SCENE_MAP:
            start, end = SCENE_MAP[name]
            # Point 86: Added chunking logic for parallel render support
            chunk_size = 500
            for frame_start in range(start, end + 1, chunk_size):
                frame_end = min(frame_start + chunk_size - 1, end)
                print(f"Queueing chunk for scene: {name} (Frames {frame_start}-{frame_end})")

                master.scene.frame_start = frame_start
                master.scene.frame_end = frame_end
                master.scene.render.filepath = os.path.join(output_dir, f"{name}_{frame_start}_")
                bpy.ops.render.render(animation=True)

def main():
    # This can be called from command line:
    # blender -b movie.blend -P render_manager.py -- --scenes scene01_intro,scene02_garden
    argv = sys.argv
    args = argv[argv.index("--") + 1:] if "--" in argv else []

    scene_list = []
    if '--scenes' in args:
        scene_list = args[args.index('--scenes') + 1].split(',')

    # We'd need to instantiate MovieMaster here if called directly
    # but usually this is called from within silent_movie_generator context

if __name__ == "__main__":
    main()

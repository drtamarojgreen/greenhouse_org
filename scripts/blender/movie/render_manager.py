import bpy
import os
import sys
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
            print(f"Queueing render for scene: {name} (Frames {start}-{end})")

            master.scene.frame_start = start
            master.scene.frame_end = end
            master.scene.render.filepath = os.path.join(output_dir, f"{name}_")

            # Use bpy.ops.render.render to render the animation for this range
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

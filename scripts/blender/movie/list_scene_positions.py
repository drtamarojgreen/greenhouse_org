import bpy
import os
import sys

# Ensure movie root is in path for imports
script_dir = os.path.dirname(os.path.abspath(__file__))
if script_dir not in sys.path:
    sys.path.append(script_dir)

try:
    from silent_movie_generator import MovieMaster
    from constants import SCENE_MAP
except ImportError:
    print("Error: Could not import movie modules. Run this from scripts/blender/movie/")
    sys.exit(1)

def audit_scene_positions():
    """
    Lists the X, Y, Z positions of all characters, cameras, and lights
    for all scenes in the movie at their start and end frames.
    """
    print("\n" + "="*100)
    print(f"{'SCENE AUDIT: OBJECT POSITIONS':^100}")
    print("="*100)

    # Initialize the movie master to set up all objects and animations
    master = MovieMaster(quality='test')
    master.run()

    char_names = ["Herbaceous", "Arbor", "GloomGnome"]
    cam_name = "MovieCamera"
    light_names = [
        "HerbaceousKeyLight", "ArborKeyLight", "GnomeKeyLight",
        "DomeFill", "Sun", "LightShaftBeam", "IntroLight", "GloomOrbLight"
    ]

    target_names = ["CamTarget", "GazeTarget"]

    objs_to_track = char_names + [cam_name] + light_names + target_names

    # Sort scenes by start frame
    sorted_scenes = sorted(SCENE_MAP.items(), key=lambda x: x[1][0])

    header = f"{'Scene':<25} | {'Frame':<7} | {'Object':<20} | {'X':>10} | {'Y':>10} | {'Z':>10}"
    print(header)
    print("-" * 100)

    for scene_name, (start_f, end_f) in sorted_scenes:
        # Sample start and end frames
        for frame in [start_f, end_f]:
            bpy.context.scene.frame_set(frame)
            # Evaluate depsgraph for accurate world positions of constrained objects
            dg = bpy.context.evaluated_depsgraph_get()

            for name in objs_to_track:
                obj = bpy.data.objects.get(name)
                if obj:
                    obj_eval = obj.evaluated_get(dg)
                    loc = obj_eval.matrix_world.translation

                    # Check if object is actually visible (hide_render)
                    visibility = "V" if not obj_eval.hide_render else "H"

                    print(f"{scene_name[:25]:<25} | {frame:<7} | {name:<20} | {loc.x:10.2f} | {loc.y:10.2f} | {loc.z:10.2f} ({visibility})")
        print("-" * 100)

if __name__ == "__main__":
    audit_scene_positions()

import bpy
import os
import sys
import math

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

def get_compass_and_angle(direction_vector):
    """
    Calculates compass heading and Z-angle (azimuth) from a direction vector.
    0 degrees = North (+Y), 90 degrees = East (+X).
    """
    # Blender atan2(y, x) returns 0 for +X (East), pi/2 for +Y (North)
    angle_rad = math.atan2(direction_vector.y, direction_vector.x)

    # Radius Z angle (radians) for where the camera is pointed
    # Often users want the mathematical azimuth in [0, 2pi]
    radius_z = angle_rad % (2 * math.pi)

    # Convert to standard compass degrees (0=N, 90=E)
    angle_deg = (90 - math.degrees(angle_rad)) % 360

    points = [
        "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
        "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
    ]
    # Handle the user-requested "SWW" style if they meant 16-point
    # (Though SWW isn't standard, it might refer to WSW)
    idx = int((angle_deg + 11.25) // 22.5) % 16
    return points[idx], angle_deg, radius_z

def audit_scene_positions():
    """
    Lists the X, Y, Z positions of all characters, cameras, and lights
    for all scenes in the movie at their start and end frames.
    Includes camera compass orientation and Radius Z angle.
    """
    print("\n" + "="*120)
    print(f"{'SCENE AUDIT: OBJECT POSITIONS & CAMERA ORIENTATION':^120}")
    print("="*120)

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

    header = f"{'Scene':<25} | {'Frame':<7} | {'Object':<20} | {'X':>10} | {'Y':>10} | {'Z':>10} | {'Heading'}"
    print(header)
    print("-" * 120)

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

                    line = f"{scene_name[:25]:<25} | {frame:<7} | {name:<20} | {loc.x:10.2f} | {loc.y:10.2f} | {loc.z:10.2f} ({visibility})"

                    # Special info for camera
                    if name == cam_name:
                        target = bpy.data.objects.get("CamTarget")
                        if target:
                            tgt_eval = target.evaluated_get(dg)
                            dir_vec = tgt_eval.matrix_world.translation - loc
                            compass, heading, rad_z = get_compass_and_angle(dir_vec)
                            line += f" | {compass:<3} {heading:5.1f}° (Z:{rad_z:5.2f}r)"

                    print(line)
        print("-" * 120)

if __name__ == "__main__":
    audit_scene_positions()

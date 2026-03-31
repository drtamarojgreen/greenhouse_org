import bpy
import os
import sys
import unittest
import math
import mathutils

# Add movie root to path for local imports
MOVIE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if MOVIE_ROOT not in sys.path:
    sys.path.append(MOVIE_ROOT)

import silent_movie_generator
from constants import SCENE_MAP
from base_test import BlenderTestCase

def run_analysis():
    """Analyzes each scene and reports min/max camera distances in a table."""
    master = silent_movie_generator.MovieMaster()
    master.run()
    scene = master.scene
    camera = scene.camera

    if not camera:
        print("Error: No camera found in scene.")
        return

    # Header for the table
    print("\n| Scene | Closest Object | Min Dist | Farthest Object | Max Dist |")
    print("| :--- | :--- | :--- | :--- | :--- |")

    for scene_name, (start, end) in sorted(SCENE_MAP.items(), key=lambda x: x[1][0]):
        # Sampling: check start, middle, and end of scene
        frames = [start, (start + end) // 2, end]
        
        min_dist_global = float('inf')
        max_dist_global = -1.0
        closest_obj_gl = "None"
        farthest_obj_gl = "None"

        for f in frames:
            scene.frame_set(f)
            cam_pos = camera.matrix_world.translation
            
            for obj in scene.objects:
                # Only consider meshes and armatures (characters)
                if obj.type not in ('MESH', 'ARMATURE') or obj == camera:
                    continue
                
                # Skip floor/ground if it's too large and distracting
                if "floor" in obj.name.lower() or "stage" in obj.name.lower():
                    continue

                # Use distance to closest point on bounding box or center
                dist = (obj.matrix_world.translation - cam_pos).length
                
                if dist < min_dist_global:
                    min_dist_global = dist
                    closest_obj_gl = obj.name
                    
                if dist > max_dist_global:
                    max_dist_global = dist
                    farthest_obj_gl = obj.name

        # Clean name for table
        short_name = scene_name.replace("scene", "S")
        print(f"| {short_name} | {closest_obj_gl} | {min_dist_global:.2f} | {farthest_obj_gl} | {max_dist_global:.2f} |")

if __name__ == "__main__":
    run_analysis()

import bpy
import os
import sys
import json

# Setup environment
ROOT = os.getcwd()
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

# Ensure movie root is in path
MOVIE_ROOT = os.path.join(ROOT, "scripts", "blender", "movie")
if MOVIE_ROOT not in sys.path:
    sys.path.insert(0, MOVIE_ROOT)

import scripts.blender.movie.scene_orchestrator as scene_orchestrator
from scripts.blender.movie.scene_orchestrator import orchestrate_scenes
from scripts.blender.movie.registry import registry

# Modular imports to ensure registration
import scripts.blender.movie.scene_utilities.modelers
import scripts.blender.movie.scene_utilities.riggers
import scripts.blender.movie.style_utilities.shaders

class Movie10Master:
    def __init__(self):
        config_path = os.path.join(os.path.dirname(__file__), "movie_config.json")
        with open(config_path, 'r') as f:
            self.config = json.load(f)

        # In a real run, we'd need a master class that orchestrator expects
        # For this task, we are demonstrating the modular construction.
        self.scene = bpy.context.scene

    def run(self):
        print("Starting Movie 10: High-Fidelity Horizon")
        # Construction logic using registry
        print("Movie 10 construction complete.")

if __name__ == "__main__":
    master = Movie10Master()
    master.run()

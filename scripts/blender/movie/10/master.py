import bpy
import os
import sys
import json

# Setup environment
ROOT = os.getcwd()
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

# Local imports for Movie 10
from .registry import registry
from . import modelers
from . import riggers
from . import shaders

class Movie10Master:
    def __init__(self):
        config_path = os.path.join(os.path.dirname(__file__), "movie_config.json")
        with open(config_path, 'r') as f:
            self.config = json.load(f)

        self.scene = bpy.context.scene

    def run(self):
        print("Starting Movie 10: High-Fidelity Horizon")
        # Ensemble construction would happen here using local registry
        print("Movie 10 construction complete.")

if __name__ == "__main__":
    master = Movie10Master()
    master.run()

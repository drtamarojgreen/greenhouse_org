import bpy
import os
import sys
import json

# Setup localized environment
ROOT = os.getcwd()
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from .registry import registry
from . import modelers
from . import riggers
from . import shaders

class Movie10Master:
    """
    Master Controller for Movie 10.
    Manages high-fidelity scene construction, lighting, and cameras.
    """
    def __init__(self):
        config_path = os.path.join(os.path.dirname(__file__), "movie_config.json")
        with open(config_path, 'r') as f:
            self.config = json.load(f)

        self.scene = bpy.context.scene

    def setup_lighting(self):
        """Builds high-fidelity lighting rig from config."""
        print("Initializing Movie 10 Lighting...")
        for l_cfg in self.config.get("environment", {}).get("lights", []):
            light_data = bpy.data.lights.new(name=l_cfg["id"], type=l_cfg["type"])
            light_obj = bpy.data.objects.new(name=l_cfg["id"], object_data=light_data)
            bpy.context.collection.objects.link(light_obj)
            light_obj.location = l_cfg["pos"]
            light_data.energy = l_cfg["intensity"]
            light_data.color = l_cfg["color"]

    def setup_cameras(self):
        """Sets up cinematic cameras."""
        print("Initializing Movie 10 Cameras...")
        for c_cfg in self.config.get("environment", {}).get("cameras", []):
            cam_data = bpy.data.cameras.new(name=c_cfg["id"])
            cam_obj = bpy.data.objects.new(name=c_cfg["id"], object_data=cam_data)
            bpy.context.collection.objects.link(cam_obj)
            cam_obj.location = c_cfg["pos"]
            cam_obj.rotation_euler = [v * (3.14159/180.0) for v in c_cfg["rot"]]
            cam_data.lens = c_cfg["fov"]

    def build_characters(self):
        """Constructs high-fidelity protagonist characters."""
        print("Building Movie 10 Ensemble...")
        for ent in self.config.get("ensemble", {}).get("entities", []):
            modeler_cls = registry.modelers.get(ent["components"]["modeling"])
            rigger_cls = registry.riggers.get(ent["components"]["rigging"])

            if modeler_cls and rigger_cls:
                m = modeler_cls()
                r = rigger_cls()
                rig = r.build_rig(ent["id"], ent.get("parameters", {}))
                m.build_mesh(ent["id"], ent.get("parameters", {}), rig=rig)

    def run(self):
        print("--- Starting Movie 10 Production Loop ---")
        self.setup_lighting()
        self.setup_cameras()
        self.build_characters()
        print("Movie 10 Production Ready.")

if __name__ == "__main__":
    master = Movie10Master()
    master.run()

import bpy
import math
import mathutils
from .config import config

class Director:
    """Abstract Director for modular scene orchestration."""

    def __init__(self):
        self.coll_cameras = config.coll_cameras
        self.coll_env = config.coll_environment

    def setup_cameras(self):
        """Sets up cameras based on the modular configuration."""
        coll = self._ensure_collection(self.coll_cameras)
        camera_configs = config.get("cinematics.cameras", [])

        for cam_cfg in camera_configs:
            cam_id = cam_cfg["id"]
            cam_data = bpy.data.cameras.new(cam_id)
            cam_data.lens = cam_cfg.get("lens", 35.0)
            cam_data.clip_end = cam_cfg.get("clip_end", 2000.0)

            cam_obj = bpy.data.objects.new(cam_id, cam_data)
            cam_obj.location = cam_cfg["pos"]
            coll.objects.link(cam_obj)

            if cam_id == config.get("cinematics.active_camera"):
                bpy.context.scene.camera = cam_obj

    def setup_lighting(self):
        """Sets up lighting based on configuration."""
        coll = self._ensure_collection(self.coll_env)
        lighting_cfg = config.get("lighting", {})

        for light_id, cfg in lighting_cfg.items():
            light_data = bpy.data.lights.new(name=light_id, type='SUN')
            light_data.energy = cfg.get("energy", 1.0)
            light_data.color = cfg.get("color", (1.0, 1.0, 1.0))

            light_obj = bpy.data.objects.new(name=light_id, object_data=light_data)
            coll.objects.link(light_obj)

    def _ensure_collection(self, name):
        coll = bpy.data.collections.get(name) or bpy.data.collections.new(name)
        if coll.name not in bpy.context.scene.collection.children:
            bpy.context.scene.collection.children.link(coll)
        return coll

    def setup_environment(self):
        """Restores environment using modular backdrop definitions."""
        coll = self._ensure_collection(self.coll_env)
        backdrops = config.get("environment.backdrops", [])

        for bd in backdrops:
            bpy.ops.mesh.primitive_plane_add(size=config.get("environment.floor_size", 40), location=bd["pos"])
            plane = bpy.context.active_object
            plane.name = f"Backdrop_{bd['id']}"

            # Unlink from default and link to env collection
            for c in plane.users_collection: c.objects.unlink(plane)
            coll.objects.link(plane)

            plane.rotation_euler = [math.radians(r) for r in bd["rot"]]

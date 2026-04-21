import bpy
import math
import mathutils
from .config import config

class Director:
    """Abstract Director synchronized with Movie 6 standards."""

    def __init__(self):
        self.coll_cameras = config.coll_cameras
        self.coll_env = config.coll_environment

    def setup_cameras(self):
        """Standardized camera setup from modular configuration."""
        coll = self._ensure_collection(self.coll_cameras)
        camera_configs = config.get("cinematics.cameras", [])

        for cam_cfg in camera_configs:
            cam_id = cam_cfg["id"]
            cam_data = bpy.data.cameras.new(cam_id)
            cam_data.lens = cam_cfg.get("lens", 35.0)
            cam_data.clip_end = cam_cfg.get("clip_end", 2000.0)

            cam_obj = bpy.data.objects.get(cam_id) or bpy.data.objects.new(cam_id, cam_data)
            cam_obj.location = cam_cfg["pos"]
            if cam_obj.name not in coll.objects:
                coll.objects.link(cam_obj)

            # Setup Track To if target defined
            target_id = cam_cfg.get("target")
            if target_id:
                # We expect targets to be defined as focus objects or characters
                target_obj = bpy.data.objects.get(f"focus_{target_id.lower()}") or bpy.data.objects.get(f"{target_id}.Rig")
                if target_obj:
                    con = next((c for c in cam_obj.constraints if c.type == 'TRACK_TO'), None) or cam_obj.constraints.new(type='TRACK_TO')
                    con.target = target_obj
                    con.track_axis = 'TRACK_NEGATIVE_Z'
                    con.up_axis = 'UP_Y'

            if cam_id == config.get("cinematics.active_camera"):
                bpy.context.scene.camera = cam_obj

    def setup_lighting(self):
        """Standardized lighting setup from modular configuration."""
        coll = self._ensure_collection(self.coll_env)
        lighting_cfg = config.get("lighting", {})

        for light_id, cfg in lighting_cfg.items():
            light_data = bpy.data.lights.new(name=light_id, type='SUN')
            light_data.energy = cfg.get("energy", 1.0)
            light_data.color = cfg.get("color", (1.0, 1.0, 1.0))

            light_obj = bpy.data.objects.get(light_id) or bpy.data.objects.new(name=light_id, object_data=light_data)
            if light_obj.name not in coll.objects:
                coll.objects.link(light_obj)

            # Rotation based on angle (elevation, tilt, azimuth)
            # Defaulting to SUN_ROT_DEGREES pattern if angle is simplified
            angle = cfg.get("angle", 45)
            light_obj.rotation_euler = (math.radians(angle), 0, math.radians(-40))

    def _ensure_collection(self, name):
        coll = bpy.data.collections.get(name) or bpy.data.collections.new(name)
        if coll.name not in bpy.context.scene.collection.children:
            bpy.context.scene.collection.children.link(coll)
        return coll

    def setup_environment(self):
        """Standardized environment restoration matching Movie 6 architecture."""
        coll = self._ensure_collection(self.coll_env)
        backdrops = config.get("environment.backdrops", [])

        for bd in backdrops:
            bd_name = f"Backdrop_{bd['id']}"
            if bd_name not in bpy.data.objects:
                bpy.ops.mesh.primitive_plane_add(size=config.get("environment.floor_size", 40), location=bd["pos"])
                plane = bpy.context.active_object
                plane.name = bd_name

                # Unlink from default and link to env collection
                for c in plane.users_collection: c.objects.unlink(plane)
                coll.objects.link(plane)

                plane.rotation_euler = [math.radians(r) for r in bd["rot"]]

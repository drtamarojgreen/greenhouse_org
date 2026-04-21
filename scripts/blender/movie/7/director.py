import bpy
import math
import mathutils
import config

class Director:
    """Abstract Director for Movie 7, implementing Movie 6 cinematic standards."""

    def __init__(self):
        self.coll_cameras = config.coll_cameras
        self.coll_env = config.coll_environment

    def setup_cameras(self):
        coll = self._ensure_collection(self.coll_cameras)
        for cam_cfg in config.get("cinematics.cameras", []):
            cam_id = cam_cfg["id"]
            cam_data = bpy.data.cameras.new(cam_id)
            cam_data.lens = cam_cfg.get("lens", 35.0)
            cam_data.clip_end = cam_cfg.get("clip_end", 2000.0)
            cam_obj = bpy.data.objects.get(cam_id) or bpy.data.objects.new(cam_id, cam_data)
            cam_obj.location = cam_cfg["pos"]
            if cam_obj.name not in coll.objects: coll.objects.link(cam_obj)
            target_id = cam_cfg.get("target")
            if target_id:
                target_obj = bpy.data.objects.get(f"{target_id}.Rig") or bpy.data.objects.get(f"focus_{target_id.lower()}")
                if target_obj:
                    con = next((c for c in cam_obj.constraints if c.type == 'TRACK_TO'), None) or cam_obj.constraints.new(type='TRACK_TO')
                    con.target, con.track_axis, con.up_axis = target_obj, 'TRACK_NEGATIVE_Z', 'UP_Y'
            if cam_id == config.get("cinematics.active_camera"): bpy.context.scene.camera = cam_obj

    def setup_lighting(self):
        coll = self._ensure_collection(self.coll_env)
        for light_id, cfg in config.get("lighting", {}).items():
            light_data = bpy.data.lights.new(name=light_id, type='SUN')
            light_data.energy, light_data.color = cfg.get("energy", 1.0), cfg.get("color", (1,1,1))
            light_obj = bpy.data.objects.get(light_id) or bpy.data.objects.new(name=light_id, object_data=light_data)
            if light_obj.name not in coll.objects: coll.objects.link(light_obj)
            light_obj.rotation_euler = (math.radians(cfg.get("angle", 45)), 0, math.radians(-40))

    def setup_environment(self):
        coll = self._ensure_collection(self.coll_env)
        for bd in config.get("environment.backdrops", []):
            bd_name = f"Backdrop_{bd['id']}"
            if bd_name not in bpy.data.objects:
                bpy.ops.mesh.primitive_plane_add(size=config.get("environment.floor_size", 40), location=bd["pos"])
                plane = bpy.context.active_object; plane.name = bd_name
                for c in plane.users_collection: c.objects.unlink(plane)
                coll.objects.link(plane); plane.rotation_euler = [math.radians(r) for r in bd["rot"]]

    def _ensure_collection(self, name):
        coll = bpy.data.collections.get(name) or bpy.data.collections.new(name)
        if coll.name not in bpy.context.scene.collection.children: bpy.context.scene.collection.children.link(coll)
        return coll

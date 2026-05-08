import bpy
import bmesh
import math
import mathutils
import random
import movie_configuration as mc
from base import Modeler
from environment.vegetation_utils import create_bush, apply_mat

class MountainBaseModeler(Modeler):
    """
    Procedural modeler for the mountain base ascent.
    Standardized return pattern ensures reliable scene-wide orchestration.
    """

    def build_mesh(self, char_id, params, rig=None):
        coll = self._ensure_collection(mc.coll_environment)
        
        # Explicit root container for the mountain environment block
        env_root = bpy.data.objects.new(char_id, None)
        coll.objects.link(env_root)

        mount_cfg = params.get("mountain", {})
        veg_cfg = params.get("vegetation", {})
        W, H = mount_cfg.get("width", 80.0), mount_cfg.get("height", 60.0)
        angle = math.radians(mount_cfg.get("slope_angle_deg", 55.0))

        # 1. Mountain Face Construction
        face_obj = self._create_face(char_id, W, H, angle, mount_cfg, coll)
        face_obj.parent = env_root

        # 2. Ground Apron
        apron = self._create_apron(W, coll)
        apron.parent = env_root

        # 3. Sparse Vegetation Population
        self._scatter_bushes(W, angle, veg_cfg, coll, env_root)

        return env_root

    def _ensure_collection(self, name):
        coll = bpy.data.collections.get(name) or bpy.data.collections.new(name)
        if coll.name not in bpy.context.scene.collection.children:
            bpy.context.scene.collection.children.link(coll)
        return coll

    def _create_face(self, name, W, H, angle, cfg, coll):
        mesh = bpy.data.meshes.new(f"{name}_face")
        obj = bpy.data.objects.new(f"{name}_face", mesh); coll.objects.link(obj)
        bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=40, y_segments=60, size=1.0)
        ledge_count, snow_z = cfg.get("ledge_count", 6), cfg.get("snow_line_z", 45.0)
        for v in bm.verts:
            y_norm = v.co.y + 0.5
            v.co.x *= W/2; v.co.y = y_norm * (H / math.tan(angle)); v.co.z = y_norm * H
            l_idx = int(y_norm * ledge_count)
            if abs(y_norm - (l_idx / ledge_count)) < 0.02: v.co.z = (l_idx / ledge_count) * H
        bm.to_mesh(mesh); bm.free()
        apply_mat(obj, "mat_mountain_rock", cfg.get("color_base", [0.25, 0.22, 0.18]))
        apply_mat(obj, "mat_mountain_snow", cfg.get("color_snow", [0.92, 0.95, 1.0]))
        for poly in obj.data.polygons: poly.material_index = 1 if poly.center.z > snow_z else 0
        return obj

    def _create_apron(self, W, coll):
        bpy.ops.mesh.primitive_plane_add(size=W, location=(0, -W/4, 0))
        apron = bpy.context.active_object; apron.name = "mountain_apron"; apron.scale = (2, 0.5, 1)
        apply_mat(apron, "mat_mountain_apron", [0.2, 0.18, 0.15])
        if apron.name not in coll.objects: coll.objects.link(apron)
        for c in list(apron.users_collection):
            if c != coll: c.objects.unlink(apron)
        return apron

    def _scatter_bushes(self, W, angle, cfg, coll, parent):
        if cfg.get("sparse_bushes"):
            count, max_z = cfg.get("bush_count", 15), cfg.get("max_z", 20.0)
            for i in range(count):
                pz = random.uniform(0, max_z); py = pz / math.tan(angle)
                b_name = f"mount_bush_{i}"
                create_bush(b_name, (random.uniform(-W/3, W/3), py, pz), 0.5, coll, [[0.1, 0.3, 0.1]])
                bush = bpy.data.objects.get(b_name)
                if bush: bush.parent = parent

from registry import registry
registry.register_modeling("MountainBaseModeler", MountainBaseModeler)

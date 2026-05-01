import bpy
import bmesh
import math
import mathutils
import random
from base import Modeler
from environment.vegetation_utils import create_bush, apply_mat

class MountainBaseModeler(Modeler):
    """
    Procedural modeler for the mountain base ascent.
    Feature Kept: Mountainous terrain symbolizes significant psychological
    challenges and the 'ascent' to higher levels of self-regulation.
    """

    def build_mesh(self, char_id, params, rig=None):
        coll = bpy.data.collections.get("10.MOUNTAIN") or bpy.data.collections.new("10.MOUNTAIN")
        if coll.name not in bpy.context.scene.collection.children:
            bpy.context.scene.collection.children.link(coll)

        mount_cfg = params.get("mountain", {})
        veg_cfg = params.get("vegetation", {})

        W = mount_cfg.get("width", 80.0)
        H = mount_cfg.get("height", 60.0)
        angle = math.radians(mount_cfg.get("slope_angle_deg", 55.0))

        # 1. Mountain Face
        mesh = bpy.data.meshes.new(char_id)
        obj = bpy.data.objects.new(char_id, mesh)
        coll.objects.link(obj)

        bm = bmesh.new()
        res_x, res_y = 40, 60
        bmesh.ops.create_grid(bm, x_segments=res_x, y_segments=res_y, size=1.0)

        # Deform into slope
        ledge_count = mount_cfg.get("ledge_count", 6)
        snow_z = mount_cfg.get("snow_line_z", 45.0)

        for v in bm.verts:
            # x is width, y is "up" the slope
            # Normalize y to 0..1
            y_norm = v.co.y + 0.5
            v.co.x *= W/2
            v.co.y = y_norm * (H / math.tan(angle)) # Depth
            v.co.z = y_norm * H # Height

            # Jaggedness
            v.co.x += random.uniform(-1, 1) * y_norm * 2.0
            v.co.z += random.uniform(-0.5, 0.5) * y_norm * 3.0

            # Ledges (flatten Z near ledge intervals)
            ledge_idx = int(y_norm * ledge_count)
            ledge_y = ledge_idx / ledge_count
            if abs(y_norm - ledge_y) < 0.02:
                v.co.z = ledge_y * H

        bm.to_mesh(mesh); bm.free()

        # Materials
        mat_rock = apply_mat(obj, "mat_mountain_rock", mount_cfg.get("color_base", [0.25, 0.22, 0.18]))
        mat_snow = apply_mat(obj, "mat_mountain_snow", mount_cfg.get("color_snow", [0.92, 0.95, 1.0]))

        for poly in obj.data.polygons:
            poly.material_index = 1 if poly.center.z > snow_z else 0

        # 2. Ground Apron
        bpy.ops.mesh.primitive_plane_add(size=W, location=(0, -W/4, 0))
        apron = bpy.context.active_object; apron.name = "mountain_apron"; apron.scale = (2, 0.5, 1)
        apply_mat(apron, "mat_mountain_apron", [0.2, 0.18, 0.15])
        if apron.name not in coll.objects: coll.objects.link(apron)

        # 3. Sparse Bushes
        if veg_cfg.get("sparse_bushes"):
            count = veg_cfg.get("bush_count", 15)
            max_z = veg_cfg.get("max_z", 20.0)
            for i in range(count):
                # Pick random point on lower slope
                px = random.uniform(-W/3, W/3)
                pz = random.uniform(0, max_z)
                py = pz / math.tan(angle)
                create_bush(f"mount_bush_{i}", (px, py, pz), 0.5, coll, [[0.1, 0.3, 0.1]])

        return obj

from registry import registry
registry.register_modeling("MountainBaseModeler", MountainBaseModeler)

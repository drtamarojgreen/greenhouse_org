try:
    import movie_configuration as mc
except ImportError:
    from . import movie_configuration as mc
try: import bpy
except ImportError: bpy = None
try: import bmesh
except ImportError: bmesh = None
import math
try: import mathutils
except ImportError: mathutils = None
import random
import os
import json
from base import Modeler
from environment.vegetation_utils import create_bush, apply_mat

class GreenhouseMobileModeler(Modeler):
    """
    Procedural modeler for the mobile greenhouse unit.
    Now strictly data-driven via greenhouse_mobile.json and main movie_config.json.
    """

    def __init__(self):
        config_path = os.path.join(os.path.dirname(__file__), "greenhouse_mobile.json")
        with open(config_path, 'r') as f:
            self.gm_cfg = json.load(f)

    def build_mesh(self, char_id, params, rig=None):
        coll = bpy.data.collections.get("9b.ENVIRONMENT") or bpy.data.collections.new("9b.ENVIRONMENT")
        if coll.name not in bpy.context.scene.collection.children.keys():
            bpy.context.scene.collection.children.link(coll)

        # Merge structural params from main config
        body = self.gm_cfg["body"].copy()
        body.update(params)
        L, W, H = body.get("body_length", body["length"]), body.get("body_width", body["width"]), body.get("body_height", body["height"])

        # 1. Main Body
        mesh = bpy.data.meshes.new(f"{char_id}_Body")
        obj = bpy.data.objects.new(char_id, mesh)
        coll.objects.link(obj)

        bm = bmesh.new()
        # Chassis Base
        bmesh.ops.create_cube(bm, size=1.0)
        bmesh.ops.scale(bm, vec=(L, W, body["chassis_height"]), verts=bm.verts)
        bmesh.ops.translate(bm, vec=(0, 0, body["chassis_height"]/2), verts=bm.verts)

        # Greenhouse Cabin
        ch = 0.7
        bmesh.ops.create_cube(bm, size=1.0, matrix=mathutils.Matrix.Translation((0.1*L, 0, body["cabin_z_offset"] + ch/2)))

        bmesh.ops.bevel(bm, geom=bm.edges, offset=0.08, segments=2)

        # Windows (New detailed feature)
        num_windows = params.get("num_windows", 4)
        for i in range(num_windows):
            bmesh.ops.create_cube(bm, size=0.2, matrix=mathutils.Matrix.Translation((-L/4 + i*0.5, W/2, 1.2)))

        bm.to_mesh(mesh); bm.free()

        # Apply Materials
        m_cfg = self.gm_cfg["materials"]
        m_body = apply_mat(obj, "mat_gm_body", m_cfg["body"], metallic=1.0, roughness=0.1)
        m_glass = apply_mat(obj, "mat_gm_glass", m_cfg["glass"], alpha=True, emission=0.2)
        m_chrome = apply_mat(obj, "mat_gm_chrome", m_cfg["chrome"], metallic=1.0, roughness=0.05)
        m_tire = apply_mat(obj, "mat_gm_tire", m_cfg["tire"], roughness=0.9)

        # 2. Doors
        d_w = params.get("door_width", 0.9)
        d_h = params.get("door_height", 2.0)
        self._create_door(f"{char_id}_Door", 0.9, 0.1, d_h, obj, coll, m_body)

        # 3. Wheels
        r_tire = params.get("wheel_radius", 0.6)
        for i, (lx, ly) in enumerate([(0.3*L, W/2.2), (0.3*L, -W/2.2), (-0.4*L, W/2.2), (-0.4*L, -W/2.2)]):
            w_obj = self._create_muscle_wheel(f"{char_id}_Wheel_{i}", r_tire, 0.4, coll, m_tire, m_chrome)
            w_obj.parent = obj
            w_obj.location = (lx, ly, r_tire)

        return obj

    def _create_muscle_wheel(self, name, radius, thickness, coll, tire_mat, rim_mat):
        mesh = bpy.data.meshes.new(name)
        obj = bpy.data.objects.new(name, mesh)
        coll.objects.link(obj)
        bm = bmesh.new()
        rot = mathutils.Matrix.Rotation(math.radians(90), 4, 'X')
        bmesh.ops.create_cone(bm, segments=32, radius1=radius, radius2=radius, depth=thickness, matrix=rot)
        bm.to_mesh(mesh); bm.free()
        obj.data.materials.append(tire_mat)
        obj.data.materials.append(rim_mat)
        return obj

    def _create_door(self, name, x_pos, thickness, height, parent, coll, mat):
        mesh = bpy.data.meshes.new(name)
        obj = bpy.data.objects.new(name, mesh)
        coll.objects.link(obj)
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1.0)
        bmesh.ops.scale(bm, vec=(0.8, thickness, height), verts=bm.verts)
        bmesh.ops.translate(bm, vec=(-0.4, 0, height/2), verts=bm.verts)
        bm.to_mesh(mesh); bm.free()
        obj.parent = parent
        obj.location = (x_pos, parent.dimensions.y/2 + thickness, 0.3)
        obj.data.materials.append(mat)
        return obj

try:
    from registry import registry
except ImportError:
    from .registry import registry
registry.register_modeling("GreenhouseMobileModeler", GreenhouseMobileModeler)

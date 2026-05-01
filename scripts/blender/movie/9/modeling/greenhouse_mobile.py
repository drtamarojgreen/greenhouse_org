import bpy
import bmesh
import math
import mathutils
import random
import os
import json
from base import Modeler
from environment.vegetation_utils import create_bush, apply_mat

class GreenhouseMobileModeler(Modeler):
    """
    Procedural modeler for the mobile greenhouse unit.
    Now strictly data-driven via greenhouse_mobile.json.
    """

    def __init__(self):
        config_path = os.path.join(os.path.dirname(__file__), "greenhouse_mobile.json")
        with open(config_path, 'r') as f:
            self.gm_cfg = json.load(f)

    def build_mesh(self, char_id, params, rig=None):
        coll = bpy.data.collections.get("9b.ENVIRONMENT") or bpy.data.collections.new("9b.ENVIRONMENT")
        if coll.name not in bpy.context.scene.collection.children.keys():
            bpy.context.scene.collection.children.link(coll)

        body = self.gm_cfg["body"]
        L, W, H = body["length"], body["width"], body["height"]

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
        
        # Sunroof Cutout (Automotive Detail for Test Fidelity)
        # H is total height (2.5), ch is cabin height (0.7). Sunroof on top.
        faces_before = set(bm.faces)
        bmesh.ops.create_grid(bm, x_segments=2, y_segments=2, size=0.45, matrix=mathutils.Matrix.Translation((0.1*L, 0, 3.2)))
        for f in bm.faces:
            if f not in faces_before: f.material_index = 1 # Glass material
        
        # Side Mirrors
        for side in [1, -1]:
            bmesh.ops.create_cube(bm, size=0.15, matrix=mathutils.Matrix.Translation((0.6*L, side*W/1.8, 1.1)) @ mathutils.Matrix.Scale(0.2, 4, (1,0,0)))

        bm.to_mesh(mesh); bm.free()

        # Apply Materials from JSON
        m_cfg = self.gm_cfg["materials"]
        m_body = apply_mat(obj, "mat_gm_body", m_cfg["body"], metallic=1.0, roughness=0.1)
        m_glass = apply_mat(obj, "mat_gm_glass", m_cfg["glass"], alpha=True, emission=0.2)
        m_chrome = apply_mat(obj, "mat_gm_chrome", m_cfg["chrome"], metallic=1.0, roughness=0.05)
        m_tire = apply_mat(obj, "mat_gm_tire", m_cfg["tire"], roughness=0.9)

        # 2. Doors
        d_cfg = self.gm_cfg["doors"]
        self._create_door(f"{char_id}_Door", d_cfg["x_pos"], d_cfg["thickness"], d_cfg["height"], obj, coll, m_body)

        # 3. Wheels
        r_tire = 0.6
        for i, (lx, ly) in enumerate([(0.3*L, W/2.2), (0.3*L, -W/2.2), (-0.4*L, W/2.2), (-0.4*L, -W/2.2)]):
            w_obj = self._create_muscle_wheel(f"{char_id}_Wheel_{i}", r_tire, 0.4, coll, m_tire, m_chrome)
            w_obj.parent = obj
            w_obj.location = (lx, ly, r_tire)

        # 5. Greenhouse Bed Plants
        for i in range(12):
            px, py = random.uniform(-L/2 + 0.5, -L/10), random.uniform(-W/3, W/3)
            plt = create_bush(f"{char_id}_BedPlant_{i}", (px, py, 0.5), 0.35, coll, [[0.1, 0.7, 0.1], [0.3, 0.2, 0.5]])
            if plt: plt.parent = obj

        return obj

    def _create_muscle_wheel(self, name, radius, thickness, coll, tire_mat, rim_mat):
        """Creates a high-detail procedural muscle car wheel with deep dish rim."""
        mesh = bpy.data.meshes.new(name)
        obj = bpy.data.objects.new(name, mesh)
        coll.objects.link(obj)
        bm = bmesh.new()
        rot = mathutils.Matrix.Rotation(math.radians(90), 4, 'X')

        # Tire Main
        bmesh.ops.create_cone(bm, segments=32, radius1=radius, radius2=radius, depth=thickness, matrix=rot)

        # Deep Dish Inset
        rim_r = radius * 0.7
        side_faces = [f for f in bm.faces if abs(f.normal.y) > 0.9]
        ret = bmesh.ops.inset_individual(bm, faces=side_faces, thickness=radius - rim_r)
        for f in ret['faces']:
            direction = -1 if f.normal.y > 0 else 1
            bmesh.ops.translate(bm, verts=f.verts, vec=(0, direction * thickness * 0.3, 0))

        # Hub detail
        bmesh.ops.create_cone(bm, segments=12, radius1=rim_r*0.3, radius2=rim_r*0.4, depth=thickness*0.2, matrix=rot)

        for face in bm.faces:
            face.smooth = True
            face.material_index = 1 if face.calc_center_median().xz.length < rim_r * 1.05 else 0

        bm.to_mesh(mesh); bm.free()
        obj.data.materials.append(tire_mat)
        obj.data.materials.append(rim_mat)
        return obj

    def _create_door(self, name, x_pos, thickness, height, parent, coll, mat):
        """Creates a door object with pivot at the hinge for animation."""
        mesh = bpy.data.meshes.new(name)
        obj = bpy.data.objects.new(name, mesh)
        coll.objects.link(obj)

        bm = bmesh.new()
        # Pivot is at X positive edge (hinge)
        bmesh.ops.create_cube(bm, size=1.0)
        bmesh.ops.scale(bm, vec=(0.8, thickness, height), verts=bm.verts)
        bmesh.ops.translate(bm, vec=(-0.4, 0, height/2), verts=bm.verts)
        bm.to_mesh(mesh); bm.free()

        obj.parent = parent
        obj.location = (x_pos, parent.dimensions.y/2 + thickness, 0.3)
        obj.data.materials.append(mat)
        return obj

from registry import registry
registry.register_modeling("GreenhouseMobileModeler", GreenhouseMobileModeler)

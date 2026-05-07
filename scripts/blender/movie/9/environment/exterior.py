import bpy
import bmesh
import math
import random
import mathutils
from base import Modeler
import movie_configuration
from environment.vegetation_utils import create_branching_tree, create_bush, apply_mat

class ExteriorModeler(Modeler):
    """
    OO Universal Modeler for Exterior/Greenhouse Shell.
    Standardizes object naming to ensure registry-based context filtering and test parity.
    """

    def build_mesh(self, char_id, params, rig=None):
        coll = self._setup_collection()
        env_root = bpy.data.objects.new(char_id, None)
        coll.objects.link(env_root)

        # 1. Structural Shell (Floors and Roof)
        self._build_structural_shell(coll, env_root, params)

        # 2. Mental Architecture (Pillars and Path)
        self._build_architecture(coll, env_root, params)

        # 3. Environmental Detail (Mountains and Vegetation)
        if "mountains" in params:
            self._create_mountain_range(coll, env_root, params["mountains"])
        
        if "vegetation" in params:
            self._scatter_vegetation(coll, env_root, params["vegetation"])

        return env_root

    def _setup_collection(self):
        coll = bpy.data.collections.get("9b.ENVIRONMENT") or bpy.data.collections.new("9b.ENVIRONMENT")
        if coll.name not in bpy.context.scene.collection.children:
            bpy.context.scene.collection.children.link(coll)
        return coll

    def _build_structural_shell(self, coll, root, params):
        f_cfg = params.get("floor", {})
        self._create_floor(coll, root, "interior_floor", f_cfg.get("size", 60), f_cfg.get("interior_color", (0.22, 0.12, 0.05, 1.0)), 'PLANE')
        self._create_floor(coll, root, "exterior_floor", f_cfg.get("exterior_radius", 300), f_cfg.get("exterior_color", (0.02, 0.15, 0.02, 1.0)), 'CIRCLE')
        
        r_cfg = params.get("roof", {})
        if r_cfg: self._create_roof(coll, root, r_cfg)

    def _build_architecture(self, coll, root, params):
        p_cfg = params.get("pillars", {})
        if p_cfg:
            size = params.get("floor", {}).get("size", 60)
            self._create_pillars(coll, root, p_cfg, size / 2)

        path_cfg = params.get("rock_path", {})
        if path_cfg:
            self._create_rock_path(coll, root, path_cfg, params.get("floor", {}).get("size", 60) / 2)

    def _create_floor(self, coll, root, name, size, color, shape):
        if shape == 'PLANE': bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, -0.02))
        else: bpy.ops.mesh.primitive_circle_add(radius=size, fill_type='NGON', location=(0, 0, -0.05))
        obj = bpy.context.active_object; obj.name = name; obj.parent = root
        apply_mat(obj, f"mat_{name}", color)

    def _create_roof(self, coll, root, cfg):
        L, W, H = cfg.get("length", 40), cfg.get("width", 60), cfg.get("height", 10)
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, H), scale=(L / 2.0, W / 2.0, 0.08))
        obj = bpy.context.active_object; obj.name = "greenhouse_roof"; obj.parent = root
        apply_mat(obj, "mat_roof", cfg.get("color", (0.7, 0.85, 1.0, 0.2)), alpha=True)

    def _create_pillars(self, coll, root, cfg, half):
        corners = [(-half, -half), (half, -half), (-half, half), (half, half)]
        radius, height = cfg.get("radius", 0.8), cfg.get("height", 10.0)
        for i, pos in enumerate(corners):
            mesh = bpy.data.meshes.new(f"pillar_{i}"); obj = bpy.data.objects.new(f"pillar_{i}", mesh)
            coll.objects.link(obj); obj.parent = root; obj.location = (pos[0], pos[1], 0)
            bm = bmesh.new(); bmesh.ops.create_cone(bm, segments=16, radius1=radius, radius2=radius, depth=height, matrix=mathutils.Matrix.Translation((0,0,height/2)))
            bm.to_mesh(mesh); bm.free()
            apply_mat(obj, "mat_marble", cfg.get("color", (0.95, 0.95, 0.97, 1.0)))

    def _create_rock_path(self, coll, root, cfg, half):
        mesh = bpy.data.meshes.new("rock_path"); obj = bpy.data.objects.new("rock_path", mesh); coll.objects.link(obj); obj.parent = root
        L, W = cfg.get("length", 40), cfg.get("width", 2.5); bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=2, y_segments=20, size=1.0)
        for v in bm.verts: v.co.x *= W/2; v.co.y = (v.co.y - 0.5) * L - half
        bm.to_mesh(mesh); bm.free()
        apply_mat(obj, "mat_rock", cfg.get("color", (0.42, 0.42, 0.42, 1.0)))

    def _create_mountain_range(self, coll, root, cfg):
        mesh = bpy.data.meshes.new("mountain_range")
        obj = bpy.data.objects.new("mountain_range", mesh)
        coll.objects.link(obj); obj.parent = root
        num, rad = cfg.get("count", 24), cfg.get("radius", 250); bm = bmesh.new()
        for i in range(num):
            angle = (i / num) * math.pi * 2; px, py = math.sin(angle) * rad, math.cos(angle) * rad
            v_peak = bm.verts.new((px, py, random.uniform(40, 100))); v1 = bm.verts.new((px-20, py-20, 0)); v2 = bm.verts.new((px+20, py-20, 0)); v3 = bm.verts.new((px, py+20, 0)); bm.faces.new((v1, v2, v_peak)); bm.faces.new((v2, v3, v_peak)); bm.faces.new((v3, v1, v_peak))
        bm.to_mesh(mesh); bm.free()
        apply_mat(obj, "mat_mountains", cfg.get("color", (0.05, 0.05, 0.08, 1.0)))

    def _scatter_vegetation(self, coll, root, cfg):
        veg_root = bpy.data.objects.new("vegetation", None); coll.objects.link(veg_root); veg_root.parent = root
        count, shades = cfg.get("count", 50), cfg.get("shades", [(0.04, 0.22, 0.04)])
        for i in range(count):
            angle, dist = random.uniform(0, math.pi * 2), random.uniform(40, 150); loc = (math.sin(angle)*dist, math.cos(angle)*dist, 0)
            create_branching_tree(f"ext_tree_{i}", loc, random.uniform(2.5, 5.0), coll, shades, 'round')
            tree = bpy.data.objects.get(f"ext_tree_{i}")
            if tree: tree.parent = veg_root

from registry import registry
registry.register_modeling("ExteriorModeler", ExteriorModeler)

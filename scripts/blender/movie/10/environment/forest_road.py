try:
    import bpy
    import bmesh
    import mathutils
except ImportError:
    bpy = None
    bmesh = None
    mathutils = None

import math
import random
import movie_configuration as mc
from base import Modeler
from environment.vegetation_utils import create_branching_tree, apply_mat
from registry import registry

class ForestRoadModeler(Modeler):
    """
    Procedural modeler for the forest road sequence.
    Builds a hierarchical environment block for transitional mental spaces.
    """

    def build_mesh(self, char_id, params, rig=None):
        coll = self._ensure_collection(mc.coll_environment)

        # Consistent root container for explicit tracking
        env_root = bpy.data.objects.new(char_id, None)
        coll.objects.link(env_root)

        road_cfg = params.get("road", {})
        tree_cfg = params.get("trees", {})
        length, width = road_cfg.get("length", 120.0), road_cfg.get("width", 4.0)

        # 1. Dirt Road Construction
        road_obj = self._create_road(char_id, length, width, road_cfg, coll)
        road_obj.parent = env_root

        # 2. Tree Corridor Population
        self._scatter_trees(length, tree_cfg, coll, env_root)

        # 3. Ground Apron
        apron = self._create_apron(length, coll)
        apron.parent = env_root

        return env_root

    def _ensure_collection(self, name):
        coll = bpy.data.collections.get(name) or bpy.data.collections.new(name)
        if coll.name not in bpy.context.scene.collection.children:
            bpy.context.scene.collection.children.link(coll)
        return coll

    def _create_road(self, name, L, W, cfg, coll):
        mesh = bpy.data.meshes.new(f"{name}_geo")
        obj = bpy.data.objects.new(f"{name}_geo", mesh); coll.objects.link(obj)
        bm = bmesh.new(); bmesh.ops.create_grid(bm, x_segments=20, y_segments=100, size=1.0)
        for v in bm.verts:
            v.co.x *= W/2; v.co.y = (v.co.y + 0.5) * L
            if cfg.get("ruts"):
                d = min(abs(v.co.x - W/4), abs(v.co.x + W/4))
                if d < W/6: v.co.z -= (W/6 - d) * 0.3
        bm.to_mesh(mesh); bm.free()
        apply_mat(obj, "mat_dirt_road", cfg.get("color", [0.22, 0.16, 0.10]))
        return obj

    def _scatter_trees(self, L, cfg, coll, parent):
        shades = [[0.04, 0.22, 0.04], [0.07, 0.30, 0.07]]
        count = cfg.get("count", 60); corr_w = cfg.get("corridor_width", 6.0); depth = cfg.get("depth", 40.0)
        for i in range(count):
            side = -1 if i % 2 == 0 else 1
            px = side * (corr_w / 2 + random.uniform(0, depth)); py = random.uniform(0, L)
            t_name = f"forest_tree_{i}"
            create_branching_tree(t_name, (px, py, 0), random.uniform(2.5, 5.0), coll, shades, random.choice(['evergreen', 'maple']))
            tree = bpy.data.objects.get(t_name)
            if tree: tree.parent = parent

    def _create_apron(self, L, coll):
        bpy.ops.mesh.primitive_plane_add(size=L, location=(0, L/2, -0.05))
        apron = bpy.context.active_object; apron.name = "forest_ground"; apron.scale = (10, 1, 1)
        apply_mat(apron, "mat_forest_ground", [0.1, 0.12, 0.08])
        if apron.name not in coll.objects: coll.objects.link(apron)
        for c in list(apron.users_collection):
            if c != coll: c.objects.unlink(apron)
        return apron

registry.register_modeling("ForestRoadModeler", ForestRoadModeler)

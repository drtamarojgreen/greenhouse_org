import bpy
import bmesh
import math
import mathutils
import random
from base import Modeler
from environment.vegetation_utils import create_branching_tree, apply_mat

class ForestRoadModeler(Modeler):
    """
    Procedural modeler for the forest road sequence.
    Feature Kept: The forest road environment provides a transitional space
    representing cognitive movement between mental regions, ported from Movie 9.
    """

    def build_mesh(self, char_id, params, rig=None):
        coll = bpy.data.collections.get("9.FOREST_ROAD") or bpy.data.collections.new("9.FOREST_ROAD")
        if coll.name not in bpy.context.scene.collection.children:
            bpy.context.scene.collection.children.link(coll)

        road_cfg = params.get("road", {})
        tree_cfg = params.get("trees", {})

        L = road_cfg.get("length", 120.0)
        W = road_cfg.get("width", 4.0)

        # 1. Dirt Road
        mesh = bpy.data.meshes.new(char_id)
        obj = bpy.data.objects.new(char_id, mesh)
        coll.objects.link(obj)

        bm = bmesh.new()
        # Subdivided plane
        bmesh.ops.create_grid(bm, x_segments=20, y_segments=100, size=1.0)
        # Scale to L x W
        for v in bm.verts:
            v.co.x *= W/2
            v.co.y = (v.co.y + 0.5) * L # 0 to L

        if road_cfg.get("ruts"):
            # Apply Noise-based ruts
            for v in bm.verts:
                # Two ruts at +/- W/4
                dist_to_rut = min(abs(v.co.x - W/4), abs(v.co.x + W/4))
                if dist_to_rut < W/6:
                    v.co.z -= (W/6 - dist_to_rut) * 0.3

        bm.to_mesh(mesh); bm.free()
        apply_mat(obj, "mat_dirt_road", road_cfg.get("color", [0.22, 0.16, 0.10]))

        # 2. Tree Corridor
        shades = [[0.04, 0.22, 0.04], [0.07, 0.30, 0.07]]
        count = tree_cfg.get("count", 60)
        corr_w = tree_cfg.get("corridor_width", 6.0)
        depth = tree_cfg.get("depth", 40.0)

        for i in range(count):
            side = -1 if i % 2 == 0 else 1
            px = side * (corr_w / 2 + random.uniform(0, depth))
            py = random.uniform(0, L)
            scale = random.uniform(2.5, 5.0)
            kind = random.choice(tree_cfg.get("canopy_types", ["evergreen", "maple"]))
            create_branching_tree(f"forest_tree_{i}", (px, py, 0), scale, coll, shades, kind)

        # 3. Ground Apron
        bpy.ops.mesh.primitive_plane_add(size=L, location=(0, L/2, -0.05))
        apron = bpy.context.active_object
        apron.name = "forest_ground"
        apron.scale = (10, 1, 1)
        apply_mat(apron, "mat_forest_ground", [0.1, 0.12, 0.08])
        if apron.name not in coll.objects: coll.objects.link(apron)

        return obj

from registry import registry
registry.register_modeling("ForestRoadModeler", ForestRoadModeler)

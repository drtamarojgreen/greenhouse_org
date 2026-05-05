import bpy
import bmesh
import math
import random
import mathutils
from base import Modeler
from config import config
from environment.vegetation_utils import create_branching_tree, create_bush, apply_mat

class ExteriorModeler(Modeler):
    """
    OO Universal Modeler for the Exterior Environment, matching Movie 9 requirements.
    Architecture Kept: The modular environment construction from Movie 9 is
    retained to ensure that 'every element must be interpretable within the system'.
    Components like pillars and mountains represent structural and foundational
    psychological barriers.
    """

    def validate_params(self, params):
        """Ensures required environment blocks are present."""
        required = ["floor", "roof", "pillars", "mountains", "vegetation", "rock_path"]
        for r in required:
            if r not in params:
                 print(f"Warning: ExteriorModeler missing '{r}' configuration.")

    def build_mesh(self, char_id, params, rig=None):
        coll = bpy.data.collections.get("9b.ENVIRONMENT") or bpy.data.collections.new("9b.ENVIRONMENT")
        if coll.name not in bpy.context.scene.collection.children:
            bpy.context.scene.collection.children.link(coll)
        env_root = bpy.data.objects.new(char_id, None)
        coll.objects.link(env_root)

        env_cfg = params # passed from Director/CharacterBuilder

        # 1. Floors
        f_cfg = env_cfg.get("floor", {})
        self._create_floor(coll, "interior_floor", f_cfg.get("size", 60), f_cfg.get("interior_color", (0.22, 0.12, 0.05, 1.0)), type='PLANE')
        self._create_floor(coll, "exterior_floor", f_cfg.get("exterior_radius", 300), f_cfg.get("exterior_color", (0.02, 0.15, 0.02, 1.0)), type='CIRCLE')

        # 2. Greenhouse Structure
        r_cfg = env_cfg.get("roof", {})
        self._create_roof(coll, r_cfg)

        p_cfg = env_cfg.get("pillars", {})
        # Resolve height derivation
        h = p_cfg.get("height")
        if h is None and "derive_from" in p_cfg:
            h = config.get(p_cfg["derive_from"], 10.0)
        elif h is None:
            h = 10.0

        self._create_pillars_and_statues(coll, p_cfg, env_cfg.get("floor", {}).get("size", 60)/2, h)

        # 3. Features
        self._create_lavender_beds(coll, env_cfg.get("lavender", {}), env_cfg.get("floor", {}).get("size", 60)/2)
        self._create_rock_path(coll, env_cfg.get("rock_path", {}), env_cfg.get("floor", {}).get("size", 60)/2)

        torches_cfg = env_cfg.get("torches", {})
        self._create_path_torches(coll, env_cfg.get("floor", {}).get("size", 60)/2, env_cfg.get("rock_path", {}), torches_cfg)

        if "mountains" in env_cfg:
            self._create_mountain_range(coll, env_cfg.get("mountains", {}))
        if "vegetation" in env_cfg:
            self._scatter_vegetation(coll, env_cfg.get("vegetation", {}), env_cfg.get("floor", {}).get("size", 60)/2)

        # Parent environment objects to a single root so Director visibility keyframes
        # can consistently show/hide the whole set for scene timing.
        for obj in list(coll.objects):
            if obj != env_root and obj.parent is None:
                obj.parent = env_root

        return env_root

    def _create_floor(self, coll, name, size, color, type='PLANE'):
        if type == 'PLANE':
            bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, -0.02))
        else:
            bpy.ops.mesh.primitive_circle_add(radius=size, fill_type='NGON', location=(0, 0, -0.05))

        obj = bpy.context.active_object
        obj.name = name
        apply_mat(obj, f"mat_{name}", color)
        self._link_to_coll(obj, coll)

    def _create_roof(self, coll, cfg):
        # Increased depth (W) to 60m to accommodate the extensive interior layout
        L, W, H = cfg.get("length", 40), cfg.get("width", 60), cfg.get("height", 10)
        size = max(L, W)
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, H), scale=(L / 2.0, W / 2.0, 0.08))
        roof = bpy.context.active_object
        roof.name = "greenhouse_roof"
        mat = apply_mat(roof, "mat_roof", cfg.get("color", (0.7, 0.85, 1.0, 0.2)), alpha=True)
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            if "IOR" in bsdf.inputs: bsdf.inputs["IOR"].default_value = 1.45
            if "Specular" in bsdf.inputs: bsdf.inputs["Specular"].default_value = 0.8
        self._link_to_coll(roof, coll)

    def _create_pillars_and_statues(self, coll, cfg, half, h):
        corners = [(-half, -half), (half, -half), (-half, half), (half, half)]
        r = cfg.get("radius", 0.8)
        for i, (cx, cy) in enumerate(corners):
            mesh = bpy.data.meshes.new(f"pillar_{i}")
            p = bpy.data.objects.new(f"pillar_{i}", mesh)
            coll.objects.link(p)
            p.location = (cx, cy, 0)
            bm = bmesh.new()
            bmesh.ops.create_cone(bm, segments=16, radius1=r*1.4, radius2=r*1.4, depth=0.5, matrix=mathutils.Matrix.Translation((0, 0, 0.25)))
            bmesh.ops.create_cone(bm, segments=16, radius1=r, radius2=r*0.9, depth=h-1.0, matrix=mathutils.Matrix.Translation((0, 0, h/2)))
            bmesh.ops.create_cone(bm, segments=16, radius1=r*1.4, radius2=r*1.4, depth=0.5, matrix=mathutils.Matrix.Translation((0, 0, h-0.25)))
            bm.to_mesh(mesh); bm.free()
            apply_mat(p, "mat_marble", cfg.get("color", (0.95, 0.95, 0.97, 1.0)))

            s_name = f"statue_{i}"
            s_mesh = bpy.data.meshes.new(s_name)
            s = bpy.data.objects.new(s_name, s_mesh); coll.objects.link(s)
            s.location = (cx, cy, h)
            bm_s = bmesh.new()
            sx = mathutils.Matrix.Scale(1.0, 4, (1, 0, 0)); sy = mathutils.Matrix.Scale(0.65, 4, (0, 1, 0)); sz = mathutils.Matrix.Scale(1.35, 4, (0, 0, 1))
            body_mat = mathutils.Matrix.Translation((0, 0, 0.42)) @ (sx @ sy @ sz)
            bmesh.ops.create_uvsphere(bm_s, u_segments=10, v_segments=8, radius=0.38, matrix=body_mat)
            bmesh.ops.create_uvsphere(bm_s, u_segments=8, v_segments=6, radius=0.20, matrix=mathutils.Matrix.Translation((0.12, 0, 0.92)))
            for ey in [-0.10, 0.10]:
                bmesh.ops.create_cone(bm_s, segments=4, radius1=0.055, radius2=0, depth=0.11, matrix=mathutils.Matrix.Translation((-0.06, ey, 1.10)))
            for px in [-0.13, 0.13]:
                bmesh.ops.create_uvsphere(bm_s, u_segments=6, v_segments=4, radius=0.08, matrix=mathutils.Matrix.Translation((px, 0.28, 0.08)))
            for t in range(5):
                a = t * 0.28
                bmesh.ops.create_cone(bm_s, segments=4, radius1=0.035, radius2=0.02, depth=0.16, matrix=mathutils.Matrix.Translation((-0.32 + t*0.04, 0.1 + math.sin(a)*0.2, 0.15 + t*0.06)))
            bm_s.to_mesh(s_mesh); bm_s.free()
            apply_mat(s, "mat_stone", (0.55, 0.52, 0.5, 1.0))

    def _create_lavender_beds(self, coll, cfg, half):
        depth, dens = cfg.get("depth", 8.0), cfg.get("density", 80)
        path_w = 2.5 / 2.0 + 0.6
        y_front = -half
        side_spread = cfg.get("side_spread", half - path_w)
        max_stalk_h = cfg.get("max_stalk_height", 0.65)

        bed_regions = [(-path_w - side_spread, -path_w), (path_w, path_w + side_spread)]
        for s, (x_min, x_max) in enumerate(bed_regions):
            for j in range(dens):
                px = random.uniform(x_min, x_max); py = random.uniform(y_front - depth, y_front)
                mesh = bpy.data.meshes.new(f"lavender_{s}_{j}")
                l = bpy.data.objects.new(f"lavender_{s}_{j}", mesh); coll.objects.link(l)
                l.location = (px, py, 0)
                bm = bmesh.new()
                for _ in range(random.randint(3, 6)):
                    ox = random.uniform(-0.14, 0.14); oy = random.uniform(-0.14, 0.14); sh = random.uniform(0.56, max_stalk_h * 2)
                    bmesh.ops.create_cone(bm, segments=4, radius1=0.026, radius2=0.016, depth=sh, matrix=mathutils.Matrix.Translation((ox, oy, sh/2)))
                    bmesh.ops.create_cone(bm, segments=6, radius1=0.076, radius2=0.016, depth=0.22, matrix=mathutils.Matrix.Translation((ox, oy, sh+0.11)))
                bm.to_mesh(mesh); bm.free()
                apply_mat(l, "mat_lav_stalk", cfg.get("stalk_color", (0.25, 0.5, 0.2)))
                apply_mat(l, "mat_lavender", cfg.get("flower_color", (0.55, 0.28, 0.85)))
                for poly in l.data.polygons: poly.material_index = 1 if poly.center.z > 0.6 else 0

    def _create_rock_path(self, coll, cfg, half):
        if not cfg: return
        length, width = cfg.get("length", 40), cfg.get("width", 2.5)
        name = "rock_path"
        if bpy.data.objects.get(name): return
        mesh = bpy.data.meshes.new(name); p = bpy.data.objects.new(name, mesh); coll.objects.link(p)
        bm = bmesh.new()
        segs = max(40, int(length * 2))
        w = width / 2.0; y_start = -half; y_end = y_start - length
        for i in range(segs):
            t0 = i / segs; t1 = (i + 1) / segs
            y0 = y_start + t0 * (y_end - y_start); y1 = y_start + t1 * (y_end - y_start)
            x_off0 = math.sin(t0 * math.pi * 2.0) * (width * 0.6); x_off1 = math.sin(t1 * math.pi * 2.0) * (width * 0.6)
            v0 = bm.verts.new((x_off0 - w, y0, 0.005)); v1 = bm.verts.new((x_off0 + w, y0, 0.005))
            v2 = bm.verts.new((x_off1 + w, y1, 0.005)); v3 = bm.verts.new((x_off1 - w, y1, 0.005))
            bm.faces.new((v0, v1, v2, v3))
        bm.to_mesh(mesh); bm.free()
        apply_mat(p, "mat_rock", cfg.get("color", (0.42, 0.42, 0.42, 1.0)))

    def _create_path_torches(self, coll, half, path_cfg, torches_cfg):
        y_start = -half; length = path_cfg.get("length", 20); y_end = y_start - length
        offset = (path_cfg.get("width", 2.5) / 2.0) + 1.0
        h = torches_cfg.get("height", 2.4); spacing = torches_cfg.get("spacing", 5.0)
        y = y_start; idx = 0
        while y >= y_end:
            for side in [-1, 1]:
                name = f"torch_{idx}_{side}"; mesh = bpy.data.meshes.new(name); obj = bpy.data.objects.new(name, mesh); coll.objects.link(obj)
                obj.location = (side * offset, y, 0)
                bm = bmesh.new()
                bmesh.ops.create_cone(bm, segments=6, radius1=0.05, radius2=0.04, depth=h, matrix=mathutils.Matrix.Translation((0, 0, h/2)))
                fh = torches_cfg.get("flame_cone_height", 0.42)
                bmesh.ops.create_cone(bm, segments=8, radius1=0.14, radius2=0.05, depth=0.14, matrix=mathutils.Matrix.Translation((0, 0, h+0.07)))
                bmesh.ops.create_cone(bm, segments=6, radius1=0.07, radius2=0, depth=fh, matrix=mathutils.Matrix.Translation((0, 0, h+fh/2 + 0.14)))
                bm.to_mesh(mesh); bm.free()
                apply_mat(obj, "mat_torch_stick", (0.15, 0.08, 0.02, 1.0))
                mat_flame = bpy.data.materials.new(f"mat_flame_{name}"); mat_flame.use_nodes = True; mat_flame.node_tree.nodes.clear()
                n_out = mat_flame.node_tree.nodes.new(type='ShaderNodeOutputMaterial')
                n_emit = mat_flame.node_tree.nodes.new(type='ShaderNodeEmission')
                n_emit.inputs['Color'].default_value = torches_cfg.get("flame_color", (1.0, 0.55, 0.1, 1.0))
                n_emit.inputs['Strength'].default_value = torches_cfg.get("flame_emission_strength", 6.0)
                mat_flame.node_tree.links.new(n_emit.outputs['Emission'], n_out.inputs['Surface'])
                obj.data.materials.append(mat_flame)
                for poly in obj.data.polygons: poly.material_index = 1 if poly.center.z > h else 0
            y -= spacing; idx += 1

    def _create_mountain_range(self, coll, cfg):
        name = "mountain_range"
        if bpy.data.objects.get(name): return
        mesh = bpy.data.meshes.new(name); obj = bpy.data.objects.new(name, mesh); coll.objects.link(obj)
        bm = bmesh.new(); num, rad = cfg.get("count", 24), cfg.get("radius", 250)
        for i in range(num):
            angle = (i / num) * math.pi * 2; r_off = random.uniform(-20, 20); px = math.sin(angle) * (rad + r_off); py = math.cos(angle) * (rad + r_off)
            peak_h = random.uniform(40, 100); peak_w = random.uniform(60, 120); b_off = (math.pi * 2 / num) / 2
            v1 = bm.verts.new((math.sin(angle - b_off) * (rad + peak_w / 2), math.cos(angle - b_off) * (rad + peak_w / 2), 0))
            v2 = bm.verts.new((math.sin(angle + b_off) * (rad + peak_w / 2), math.cos(angle + b_off) * (rad + peak_w / 2), 0))
            v3 = bm.verts.new((math.sin(angle) * (rad - peak_w / 2), math.cos(angle) * (rad - peak_w / 2), 0))
            v_peak = bm.verts.new((px, py, peak_h)); bm.faces.new((v1, v2, v_peak)); bm.faces.new((v2, v3, v_peak)); bm.faces.new((v3, v1, v_peak))
        bm.to_mesh(mesh); bm.free()
        apply_mat(obj, "mat_mountains", cfg.get("color", (0.05, 0.05, 0.08, 1.0)))

    def _scatter_vegetation(self, coll, cfg, half):
        shades = cfg.get("shades", [(0.04, 0.22, 0.04)])
        leaf_cfg = cfg.get("leaf_material", {})
        tree_types = ['evergreen', 'maple', 'oak', 'bush']; weights = [0.30, 0.25, 0.25, 0.20]
        placed = 0; attempts = 0; max_attempts = cfg.get("count", 50) * 10
        while placed < cfg.get("count", 50) and attempts < max_attempts:
            attempts += 1; angle = random.uniform(0, math.pi * 2); dist = random.uniform(40, 150)
            loc_x = math.sin(angle) * dist; loc_y = math.cos(angle) * dist
            if loc_y < 0: continue
            loc = (loc_x, loc_y, 0); kind = random.choices(tree_types, weights=weights, k=1)[0]; scale = random.uniform(2.5, 5.0)
            if kind == 'evergreen': create_branching_tree(f"ext_evergreen_{placed}", loc, scale, coll, shades, 'conical', leaf_cfg)
            elif kind == 'maple': create_branching_tree(f"ext_maple_{placed}", loc, scale, coll, shades, 'round', leaf_cfg)
            elif kind == 'oak': create_branching_tree(f"ext_oak_{placed}", loc, scale, coll, shades, 'wide', leaf_cfg)
            else: create_bush(f"ext_bush_{placed}", loc, scale * 0.5, coll, shades, leaf_cfg)
            placed += 1

    def _link_to_coll(self, obj, coll):
        if obj.name not in coll.objects: coll.objects.link(obj)
        for c in list(obj.users_collection):
            if c != coll: c.objects.unlink(obj)
        if obj.type == 'MESH':
            for poly in obj.data.polygons: poly.use_smooth = True

from registry import registry
registry.register_modeling("ExteriorModeler", ExteriorModeler)

import bpy
import bmesh
import math
import random
import mathutils
from base import Modeler
import movie_configuration as mc
from environment.vegetation_utils import create_branching_tree, create_bush, apply_mat

class ExteriorModeler(Modeler):
    """
    OO Universal Modeler for Exterior/Greenhouse Shell.
    Standardizes object naming to ensure registry-based context filtering and test parity.
    Restored features from Movie 7: Torches, Lavender, Statues, Fog.
    """

    def build_mesh(self, char_id, params, rig=None):
        coll = self._setup_collection()
        env_root = bpy.data.objects.new(char_id, None)
        coll.objects.link(env_root)

        # 1. Structural Shell (Floors and Roof)
        self._build_structural_shell(coll, env_root, params)

        # 2. Mental Architecture (Pillars and Path)
        self._build_architecture(coll, env_root, params)

        # 3. Features
        self._create_lavender_beds(coll, env_root, params.get("lavender", {}), params.get("floor", {}).get("size", 60)/2)

        torches_cfg = params.get("torches", {})
        if torches_cfg:
            self._create_path_torches(coll, env_root, params.get("floor", {}).get("size", 60)/2, params.get("rock_path", {}), torches_cfg)

        # 4. Environmental Detail (Mountains and Vegetation)
        if "mountains" in params:
            self._create_mountain_range(coll, env_root, params["mountains"])
        
        if "vegetation" in params:
            self._scatter_vegetation(coll, env_root, params["vegetation"])

        # 5. Fog
        if "fog" in params:
            self._setup_fog(params["fog"])

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
        
        r_cfg = params.get("roof")
        if r_cfg is not None: self._create_roof(coll, root, r_cfg)

    def _build_architecture(self, coll, root, params):
        p_cfg = params.get("pillars", {})
        if p_cfg:
            size = params.get("floor", {}).get("size", 60)
            h = p_cfg.get("height")
            if h is None and "derive_from" in p_cfg:
                h = mc.get(p_cfg["derive_from"], 10.0)
            elif h is None:
                h = 10.0
            self._create_pillars_and_statues(coll, root, p_cfg, size / 2, h)

        path_cfg = params.get("rock_path", {})
        if path_cfg:
            self._create_rock_path(coll, root, path_cfg, params.get("floor", {}).get("size", 60) / 2)

    def _create_floor(self, coll, root, name, size, color, shape):
        if shape == 'PLANE': bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, -0.02))
        else: bpy.ops.mesh.primitive_circle_add(radius=size, fill_type='NGON', location=(0, 0, -0.05))
        obj = bpy.context.active_object; obj.name = name; obj.parent = root
        apply_mat(obj, f"mat_{name}", color)

    def _create_roof(self, coll, root, cfg):
        # Resolve dimensions, respecting 'size' as a shortcut for square roofs
        size = cfg.get("size")
        L = cfg.get("length", size if size else 40)
        W = cfg.get("width", size if size else 60)
        H = cfg.get("height", 10)

        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, H), scale=(L / 2.0, W / 2.0, 0.08))
        obj = bpy.context.active_object; obj.name = "greenhouse_roof"; obj.parent = root
        apply_mat(obj, "mat_roof", cfg.get("color", (0.7, 0.85, 1.0, 0.2)), alpha=True)

    def _create_pillars_and_statues(self, coll, root, cfg, half, h):
        corners = [(-half, -half), (half, -half), (-half, half), (half, half)]
        radius = cfg.get("radius", 0.8)
        for i, pos in enumerate(corners):
            mesh = bpy.data.meshes.new(f"pillar_{i}"); obj = bpy.data.objects.new(f"pillar_{i}", mesh)
            coll.objects.link(obj); obj.parent = root; obj.location = (pos[0], pos[1], 0)
            bm = bmesh.new()
            # Complex pillar geometry from Movie 7
            bmesh.ops.create_cone(bm, segments=16, radius1=radius*1.4, radius2=radius*1.4, depth=0.5, matrix=mathutils.Matrix.Translation((0,0,0.25)))
            bmesh.ops.create_cone(bm, segments=16, radius1=radius, radius2=radius*0.9, depth=h-1.0, matrix=mathutils.Matrix.Translation((0,0,h/2)))
            bmesh.ops.create_cone(bm, segments=16, radius1=radius*1.4, radius2=radius*1.4, depth=0.5, matrix=mathutils.Matrix.Translation((0,0,h-0.25)))
            bm.to_mesh(mesh); bm.free()
            apply_mat(obj, "mat_marble", cfg.get("color", (0.95, 0.95, 0.97, 1.0)))

            # Pillar-top Statues
            s_name = f"statue_{i}"
            s_mesh = bpy.data.meshes.new(s_name)
            s_obj = bpy.data.objects.new(s_name, s_mesh)
            coll.objects.link(s_obj); s_obj.parent = root; s_obj.location = (pos[0], pos[1], h)
            bm_s = bmesh.new()
            sx = mathutils.Matrix.Scale(1.0, 4, (1, 0, 0)); sy = mathutils.Matrix.Scale(0.65, 4, (0, 1, 0)); sz = mathutils.Matrix.Scale(1.35, 4, (0, 0, 1))
            body_mat = mathutils.Matrix.Translation((0, 0, 0.42)) @ (sx @ sy @ sz)
            bmesh.ops.create_uvsphere(bm_s, u_segments=10, v_segments=8, radius=0.38, matrix=body_mat)
            bm_s.to_mesh(s_mesh); bm_s.free()
            apply_mat(s_obj, "mat_stone", (0.55, 0.52, 0.5, 1.0))

    def _create_lavender_beds(self, coll, root, cfg, half):
        depth, dens = cfg.get("depth", 8.0), cfg.get("density", 80)
        path_w = 2.5 / 2.0 + 0.6
        y_front = -half
        side_spread = cfg.get("side_spread", half - path_w)
        max_stalk_h = cfg.get("max_stalk_height", 0.65)

        bed_regions = [(-path_w - side_spread, -path_w), (path_w, path_w + side_spread)]
        for s, (x_min, x_max) in enumerate(bed_regions):
            for j in range(dens):
                px, py = random.uniform(x_min, x_max), random.uniform(y_front - depth, y_front)
                name = f"lavender_{s}_{j}"
                mesh = bpy.data.meshes.new(name); obj = bpy.data.objects.new(name, mesh)
                coll.objects.link(obj); obj.parent = root; obj.location = (px, py, 0)
                bm = bmesh.new()
                for _ in range(random.randint(3, 6)):
                    sh = random.uniform(0.56, max_stalk_h * 2)
                    bmesh.ops.create_cone(bm, segments=4, radius1=0.026, radius2=0.016, depth=sh, matrix=mathutils.Matrix.Translation((random.uniform(-0.14, 0.14), random.uniform(-0.14, 0.14), sh/2)))
                bm.to_mesh(mesh); bm.free()
                apply_mat(obj, "mat_lavender", cfg.get("flower_color", (0.55, 0.28, 0.85)))

    def _create_path_torches(self, coll, root, half, path_cfg, torches_cfg):
        y_start = -half; length = path_cfg.get("length", 40); y_end = y_start - length
        offset = (path_cfg.get("width", 2.5) / 2.0) + 1.0
        h, spacing = torches_cfg.get("height", 2.4), torches_cfg.get("spacing", 5.0)
        y, idx = y_start, 0
        while y >= y_end:
            for side in [-1, 1]:
                name = f"torch_{idx}_{side}"; mesh = bpy.data.meshes.new(name); obj = bpy.data.objects.new(name, mesh); coll.objects.link(obj)
                obj.parent = root; obj.location = (side * offset, y, 0)
                bm = bmesh.new()
                bmesh.ops.create_cone(bm, segments=6, radius1=0.05, radius2=0.04, depth=h, matrix=mathutils.Matrix.Translation((0, 0, h/2)))
                fh = torches_cfg.get("flame_cone_height", 0.42)
                bmesh.ops.create_cone(bm, segments=6, radius1=0.07, radius2=0, depth=fh, matrix=mathutils.Matrix.Translation((0, 0, h+fh/2 + 0.14)))
                bm.to_mesh(mesh); bm.free()
                apply_mat(obj, "mat_torch_stick", (0.15, 0.08, 0.02, 1.0))
            y -= spacing; idx += 1

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
            angle, dist = random.uniform(0, math.pi * 2), random.uniform(80, 200); loc = (math.sin(angle)*dist, math.cos(angle)*dist, 0)
            create_branching_tree(f"ext_tree_{i}", loc, random.uniform(2.5, 5.0), coll, shades, 'round')
            tree = bpy.data.objects.get(f"ext_tree_{i}")
            if tree: tree.parent = veg_root

    def _setup_fog(self, cfg):
        """Sets up Volume Scatter for environmental fog."""
        world = bpy.context.scene.world
        if not world: return
        world.use_nodes = True
        nodes = world.node_tree.nodes
        links = world.node_tree.links
        vol = nodes.get("Volume Scatter") or nodes.new(type='ShaderNodeVolumeScatter')
        vol.inputs['Density'].default_value = cfg.get("density", 0.01)
        vol.inputs['Color'].default_value = cfg.get("color", (0.1, 0.5, 0.2, 1.0))
        out = nodes.get("World Output")
        if out: links.new(vol.outputs['Volume'], out.inputs['Volume'])

from registry import registry
registry.register_modeling("ExteriorModeler", ExteriorModeler)

import bpy
import bmesh
import math
import random
import mathutils
from base import Modeler

class ExteriorModeler(Modeler):
    """OO Universal Modeler for the Exterior Environment, matching Movie 6 fidelity."""

    def validate_params(self, params):
        """Ensures required environment blocks are present."""
        required = ["floor", "roof", "pillars", "mountains", "vegetation", "rock_path"]
        for r in required:
            if r not in params:
                 print(f"Warning: ExteriorModeler missing '{r}' configuration.")

    def build_mesh(self, char_id, params, rig=None):
        coll = bpy.data.collections.get("7b.ENVIRONMENT") or bpy.data.collections.new("7b.ENVIRONMENT")
        if coll.name not in bpy.context.scene.collection.children:
            bpy.context.scene.collection.children.link(coll)

        env_cfg = params # passed from Director/CharacterBuilder

        # 1. Floors
        f_cfg = env_cfg.get("floor", {})
        self._create_floor(coll, "interior_floor", f_cfg.get("size", 40), f_cfg.get("interior_color", (0.22, 0.12, 0.05, 1.0)), type='PLANE')
        self._create_floor(coll, "exterior_floor", f_cfg.get("exterior_radius", 300), f_cfg.get("exterior_color", (0.02, 0.15, 0.02, 1.0)), type='CIRCLE')

        # 2. Greenhouse Structure
        r_cfg = env_cfg.get("roof", {})
        self._create_roof(coll, r_cfg)

        p_cfg = env_cfg.get("pillars", {})
        self._create_pillars_and_statues(coll, p_cfg, env_cfg.get("floor", {}).get("size", 40)/2)

        # 3. Features
        self._create_lavender_beds(coll, env_cfg.get("lavender", {}), env_cfg.get("floor", {}).get("size", 40)/2)
        self._create_rock_path(coll, env_cfg.get("rock_path", {}), env_cfg.get("floor", {}).get("size", 40)/2)
        self._create_mountain_range(coll, env_cfg.get("mountains", {}))
        self._scatter_vegetation(coll, env_cfg.get("vegetation", {}))

        return None

    def _create_floor(self, coll, name, size, color, type='PLANE'):
        if type == 'PLANE':
            bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, -0.02))
        else:
            bpy.ops.mesh.primitive_circle_add(radius=size, fill_type='NGON', location=(0, 0, -0.05))

        obj = bpy.context.active_object
        obj.name = name
        self._apply_mat(obj, f"mat_{name}", color)
        self._link_to_coll(obj, coll)

    def _create_roof(self, coll, cfg):
        bpy.ops.mesh.primitive_plane_add(size=cfg.get("size", 42), location=(0, 0, cfg.get("height", 30)))
        roof = bpy.context.active_object
        roof.name = "greenhouse_roof"
        mat = self._apply_mat(roof, "mat_roof", cfg.get("color", (0.7, 0.85, 1.0, 0.2)), alpha=True)
        # Glass feel
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            if "IOR" in bsdf.inputs: bsdf.inputs["IOR"].default_value = 1.45
            if "Roughness" in bsdf.inputs: bsdf.inputs["Roughness"].default_value = 0.05
        self._link_to_coll(roof, coll)

    def _create_pillars_and_statues(self, coll, cfg, half):
        corners = [(-half, -half), (half, -half), (-half, half), (half, half)]
        r, h = cfg.get("radius", 0.8), cfg.get("height", 10.0)
        for i, (cx, cy) in enumerate(corners):
            # Pillar
            bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=(cx, cy, h/2))
            p = bpy.context.active_object; p.name = f"pillar_{i}"
            self._apply_mat(p, "mat_marble", cfg.get("color", (0.95, 0.95, 0.97, 1.0)))
            self._link_to_coll(p, coll)
            # Statue (Universal placeholder)
            bpy.ops.mesh.primitive_uvsphere_add(radius=r*0.5, location=(cx, cy, h + r*0.5))
            s = bpy.context.active_object; s.name = f"statue_{i}"
            self._apply_mat(s, "mat_stone", (0.55, 0.52, 0.5, 1.0))
            self._link_to_coll(s, coll)

    def _create_lavender_beds(self, coll, cfg, half):
        depth, dens = cfg.get("depth", 3.5), cfg.get("density", 35)
        for side in [-1, 1]:
            for j in range(dens):
                px = random.uniform(2, half) * side
                py = random.uniform(-half - depth, -half)
                bpy.ops.mesh.primitive_cone_add(radius1=0.05, depth=0.4, location=(px, py, 0.2))
                l = bpy.context.active_object; l.name = f"lavender_{side}_{j}"
                self._apply_mat(l, "mat_lavender", cfg.get("flower_color", (0.55, 0.28, 0.85, 1.0)))
                self._link_to_coll(l, coll)

    def _create_rock_path(self, coll, cfg, half):
        length, width = cfg.get("length", 20), cfg.get("width", 2.5)
        bpy.ops.mesh.primitive_plane_add(size=1.0, location=(0, -half - length/2, 0.01))
        p = bpy.context.active_object; p.name = "rock_path"
        p.scale = (width, length, 1.0)
        self._apply_mat(p, "mat_rock", cfg.get("color", (0.42, 0.42, 0.42, 1.0)))
        self._link_to_coll(p, coll)

    def _create_mountain_range(self, coll, cfg):
        mesh = bpy.data.meshes.new("mountains")
        obj = bpy.data.objects.new("mountain_range", mesh); coll.objects.link(obj)
        bm = bmesh.new()
        num, rad = cfg.get("count", 24), cfg.get("radius", 250)
        for i in range(num):
            a = (i/num)*math.pi*2; px, py = math.sin(a)*rad, math.cos(a)*rad
            v_peak = bm.verts.new((px, py, random.uniform(40, 80)))
            bm.verts.new((px*1.2, py*1.2, 0)); bm.verts.new((px*0.8, py*0.8, 0))
        bm.to_mesh(mesh); bm.free()
        self._apply_mat(obj, "mat_mountains", cfg.get("color", (0.05, 0.05, 0.08, 1.0)))

    def _scatter_vegetation(self, coll, cfg):
        shades = cfg.get("shades", [(0.04, 0.22, 0.04)])
        for i in range(cfg.get("count", 50)):
            a, d = random.uniform(0, math.pi*2), random.uniform(40, 150)
            loc = (math.sin(a)*d, math.cos(a)*d, 0)
            if loc[1] < 0: continue
            bpy.ops.mesh.primitive_cone_add(radius1=random.uniform(1.5, 3), depth=random.uniform(5, 10), location=loc)
            t = bpy.context.active_object; t.name = f"exterior_tree_{i}"
            self._apply_mat(t, f"mat_tree_{i}", (*random.choice(shades), 1.0))
            self._link_to_coll(t, coll)

    def _apply_mat(self, obj, name, color, alpha=False):
        mat = bpy.data.materials.new(name=name); mat.use_nodes = True
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        bsdf.inputs['Base Color'].default_value = color
        if alpha: mat.blend_method = 'BLEND'
        obj.data.materials.append(mat)
        return mat

    def _link_to_coll(self, obj, coll):
        if obj.name not in coll.objects: coll.objects.link(obj)
        for c in list(obj.users_collection):
            if c != coll: c.objects.unlink(obj)

from registry import registry
registry.register_modeling("ExteriorModeler", ExteriorModeler)

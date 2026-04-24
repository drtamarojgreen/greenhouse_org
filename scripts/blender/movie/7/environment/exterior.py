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
        self._create_path_torches(coll, env_cfg.get("floor", {}).get("size", 40)/2, env_cfg.get("rock_path", {}))
        self._create_mountain_range(coll, env_cfg.get("mountains", {}))
        self._scatter_vegetation(coll, env_cfg.get("vegetation", {}), env_cfg.get("floor", {}).get("size", 40)/2)

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
        size = cfg.get("size", 42)
        height = cfg.get("height", 30)
        # Use a thin cube so the ceiling remains visible from inside the greenhouse.
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, height), scale=(size / 2.0, size / 2.0, 0.08))
        roof = bpy.context.active_object
        roof.name = "greenhouse_roof"
        mat = self._apply_mat(roof, "mat_roof", cfg.get("color", (0.7, 0.85, 1.0, 0.2)), alpha=True)
        # Glass feel
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            if "IOR" in bsdf.inputs: bsdf.inputs["IOR"].default_value = 1.45
            if "Specular" in bsdf.inputs: bsdf.inputs["Specular"].default_value = 0.8
        self._link_to_coll(roof, coll)

    def _create_pillars_and_statues(self, coll, cfg, half):
        corners = [(-half, -half), (half, -half), (-half, half), (half, half)]
        mids = [(0, -half), (0, half), (-half, 0), (half, 0)]
        supports = corners + mids
        r, h = cfg.get("radius", 0.8), cfg.get("height", 10.0)
        for i, (cx, cy) in enumerate(supports):
            # Pillar
            mesh = bpy.data.meshes.new(f"pillar_{i}")
            p = bpy.data.objects.new(f"pillar_{i}", mesh)
            coll.objects.link(p)
            p.location = (cx, cy, 0)
            bm = bmesh.new()
            # Base slab
            bmesh.ops.create_cone(bm, segments=16, radius1=r*1.4, radius2=r*1.4, depth=0.5, matrix=mathutils.Matrix.Translation((0, 0, 0.25)))
            # Shaft
            bmesh.ops.create_cone(bm, segments=16, radius1=r, radius2=r*0.9, depth=h-1.0, matrix=mathutils.Matrix.Translation((0, 0, h/2)))
            # Capital
            bmesh.ops.create_cone(bm, segments=16, radius1=r*1.4, radius2=r*1.4, depth=0.5, matrix=mathutils.Matrix.Translation((0, 0, h-0.25)))
            bm.to_mesh(mesh)
            bm.free()
            self._apply_mat(p, "mat_marble", cfg.get("color", (0.95, 0.95, 0.97, 1.0)))
            
            # Leopard Statue
            s_name = f"statue_{i}"
            s_mesh = bpy.data.meshes.new(s_name)
            s = bpy.data.objects.new(s_name, s_mesh)
            coll.objects.link(s)
            s.location = (cx, cy, h)
            bm_s = bmesh.new()
            # Body
            sx = mathutils.Matrix.Scale(1.0, 4, (1, 0, 0)); sy = mathutils.Matrix.Scale(0.65, 4, (0, 1, 0)); sz = mathutils.Matrix.Scale(1.35, 4, (0, 0, 1))
            body_mat = mathutils.Matrix.Translation((0, 0, 0.42)) @ (sx @ sy @ sz)
            bmesh.ops.create_uvsphere(bm_s, u_segments=10, v_segments=8, radius=0.38, matrix=body_mat)
            # Head
            bmesh.ops.create_uvsphere(bm_s, u_segments=8, v_segments=6, radius=0.20, matrix=mathutils.Matrix.Translation((0.12, 0, 0.92)))
            # Ears
            for ey in [-0.10, 0.10]:
                bmesh.ops.create_cone(bm_s, segments=4, radius1=0.055, radius2=0, depth=0.11, matrix=mathutils.Matrix.Translation((-0.06, ey, 1.10)))
            # Front paws
            for px in [-0.13, 0.13]:
                bmesh.ops.create_uvsphere(bm_s, u_segments=6, v_segments=4, radius=0.08, matrix=mathutils.Matrix.Translation((px, 0.28, 0.08)))
            # Tail arc
            for t in range(5):
                a = t * 0.28
                bmesh.ops.create_cone(bm_s, segments=4, radius1=0.035, radius2=0.02, depth=0.16, matrix=mathutils.Matrix.Translation((-0.32 + t*0.04, 0.1 + math.sin(a)*0.2, 0.15 + t*0.06)))
            bm_s.to_mesh(s_mesh)
            bm_s.free()
            self._apply_mat(s, "mat_stone", (0.55, 0.52, 0.5, 1.0))

    def _create_lavender_beds(self, coll, cfg, half):
        depth, dens = cfg.get("depth", 3.5), cfg.get("density", 35)
        path_w = 2.5 / 2.0 + 0.6
        y_front = -half
        bed_regions = [(-half, -path_w), (path_w, half)]
        for s, (x_min, x_max) in enumerate(bed_regions):
            for j in range(dens):
                px = random.uniform(x_min, x_max)
                py = random.uniform(y_front - depth, y_front)
                
                mesh = bpy.data.meshes.new(f"lavender_{s}_{j}")
                l = bpy.data.objects.new(f"lavender_{s}_{j}", mesh)
                coll.objects.link(l)
                l.location = (px, py, 0)
                bm = bmesh.new()
                for _ in range(random.randint(3, 6)):
                    ox = random.uniform(-0.07, 0.07); oy = random.uniform(-0.07, 0.07); sh = random.uniform(0.28, 0.48)
                    bmesh.ops.create_cone(bm, segments=4, radius1=0.013, radius2=0.008, depth=sh, matrix=mathutils.Matrix.Translation((ox, oy, sh/2)))
                    bmesh.ops.create_cone(bm, segments=6, radius1=0.038, radius2=0.008, depth=0.11, matrix=mathutils.Matrix.Translation((ox, oy, sh+0.055)))
                bm.to_mesh(mesh)
                bm.free()
                
                mat_s = self._apply_mat(l, "mat_lav_stalk", cfg.get("stalk_color", (0.25, 0.5, 0.2)))
                mat_f = self._apply_mat(l, "mat_lavender", cfg.get("flower_color", (0.55, 0.28, 0.85)))
                for poly in l.data.polygons:
                    poly.material_index = 1 if poly.center.z > 0.30 else 0

    def _create_rock_path(self, coll, cfg, half):
        length, width = cfg.get("length", 20), cfg.get("width", 2.5)
        name = "rock_path"
        if bpy.data.objects.get(name): return
        
        mesh = bpy.data.meshes.new(name)
        p = bpy.data.objects.new(name, mesh)
        coll.objects.link(p)

        bm = bmesh.new()
        segs = 40 # smooth path
        w = width / 2.0
        y_start = -half
        y_end = y_start - length

        for i in range(segs):
            t0 = i / segs; t1 = (i + 1) / segs
            y0 = y_start + t0 * (y_end - y_start); y1 = y_start + t1 * (y_end - y_start)
            x_off0 = math.sin(t0 * math.pi * 2.0) * (width * 0.6)
            x_off1 = math.sin(t1 * math.pi * 2.0) * (width * 0.6)

            v0 = bm.verts.new((x_off0 - w, y0, 0.005))
            v1 = bm.verts.new((x_off0 + w, y0, 0.005))
            v2 = bm.verts.new((x_off1 + w, y1, 0.005))
            v3 = bm.verts.new((x_off1 - w, y1, 0.005))
            bm.faces.new((v0, v1, v2, v3))

        bm.to_mesh(mesh)
        bm.free()
        self._apply_mat(p, "mat_rock", cfg.get("color", (0.42, 0.42, 0.42, 1.0)))

    def _create_path_torches(self, coll, half, path_cfg):
        y_start = -half
        length = path_cfg.get("length", 20)
        y_end = y_start - length
        offset = (path_cfg.get("width", 2.5) / 2.0) + 1.0
        spacing = 5.0
        y = y_start
        idx = 0
        while y >= y_end:
            for side in [-1, 1]:
                name = f"torch_{idx}_{side}"
                mesh = bpy.data.meshes.new(name)
                obj = bpy.data.objects.new(name, mesh)
                coll.objects.link(obj)
                obj.location = (side * offset, y, 0)
                bm = bmesh.new()
                h = 1.2
                bmesh.ops.create_cone(bm, segments=6, radius1=0.05, radius2=0.04, depth=h, matrix=mathutils.Matrix.Translation((0, 0, h/2)))
                bmesh.ops.create_cone(bm, segments=8, radius1=0.14, radius2=0.05, depth=0.14, matrix=mathutils.Matrix.Translation((0, 0, h+0.07)))
                bmesh.ops.create_cone(bm, segments=6, radius1=0.07, radius2=0, depth=0.28, matrix=mathutils.Matrix.Translation((0, 0, h+0.28)))
                bm.to_mesh(mesh)
                bm.free()
                
                mat_stick = self._apply_mat(obj, "mat_torch_stick", (0.15, 0.08, 0.02, 1.0))
                
                mat_flame = bpy.data.materials.new(f"mat_flame_{name}")
                mat_flame.use_nodes = True
                mat_flame.node_tree.nodes.clear()
                n_out = mat_flame.node_tree.nodes.new(type='ShaderNodeOutputMaterial')
                n_emit = mat_flame.node_tree.nodes.new(type='ShaderNodeEmission')
                n_emit.inputs['Color'].default_value = (1.0, 0.55, 0.1, 1.0)
                n_emit.inputs['Strength'].default_value = 6.0
                mat_flame.node_tree.links.new(n_emit.outputs['Emission'], n_out.inputs['Surface'])
                
                obj.data.materials.append(mat_flame)
                for poly in obj.data.polygons:
                    poly.material_index = 1 if poly.center.z > h * 0.88 else 0
            y -= spacing
            idx += 1

    def _create_mountain_range(self, coll, cfg):
        name = "mountain_range"
        if bpy.data.objects.get(name): return
        mesh = bpy.data.meshes.new(name)
        obj = bpy.data.objects.new(name, mesh); coll.objects.link(obj)
        bm = bmesh.new()
        num, rad = cfg.get("count", 24), cfg.get("radius", 250)
        
        for i in range(num):
            angle = (i / num) * math.pi * 2
            r_off = random.uniform(-20, 20)
            px = math.sin(angle) * (rad + r_off)
            py = math.cos(angle) * (rad + r_off)

            peak_h = random.uniform(40, 100)
            peak_w = random.uniform(60, 120)

            b_off = (math.pi * 2 / num) / 2
            v1 = bm.verts.new((math.sin(angle - b_off) * (rad + peak_w / 2), math.cos(angle - b_off) * (rad + peak_w / 2), 0))
            v2 = bm.verts.new((math.sin(angle + b_off) * (rad + peak_w / 2), math.cos(angle + b_off) * (rad + peak_w / 2), 0))
            v3 = bm.verts.new((math.sin(angle) * (rad - peak_w / 2), math.cos(angle) * (rad - peak_w / 2), 0))
            v_peak = bm.verts.new((px, py, peak_h))
            bm.faces.new((v1, v2, v_peak))
            bm.faces.new((v2, v3, v_peak))
            bm.faces.new((v3, v1, v_peak))

        bm.to_mesh(mesh); bm.free()
        self._apply_mat(obj, "mat_mountains", cfg.get("color", (0.05, 0.05, 0.08, 1.0)))

    def _scatter_vegetation(self, coll, cfg, half):
        shades = cfg.get("shades", [(0.04, 0.22, 0.04)])
        tree_types = ['evergreen', 'maple', 'oak', 'bush']
        weights = [0.30, 0.25, 0.25, 0.20]
        
        placed = 0; attempts = 0; max_attempts = cfg.get("count", 50) * 10
        while placed < cfg.get("count", 50) and attempts < max_attempts:
            attempts += 1
            angle = random.uniform(0, math.pi * 2)
            dist = random.uniform(40, 150)
            loc_x = math.sin(angle) * dist
            loc_y = math.cos(angle) * dist
            
            # CLEAR FRONT RULE: skip -Y hemisphere
            if loc_y < 0: continue
            
            loc = (loc_x, loc_y, 0)
            kind = random.choices(tree_types, weights=weights, k=1)[0]
            scale = random.uniform(2.5, 5.0)
            
            if kind == 'evergreen': self._create_branching_tree(f"ext_evergreen_{placed}", loc, scale, coll, shades, 'conical')
            elif kind == 'maple': self._create_branching_tree(f"ext_maple_{placed}", loc, scale, coll, shades, 'round')
            elif kind == 'oak': self._create_branching_tree(f"ext_oak_{placed}", loc, scale, coll, shades, 'wide')
            else: self._create_bush(f"ext_bush_{placed}", loc, scale * 0.5, coll, shades)
            placed += 1

    def _create_branching_tree(self, name, loc, scale, coll, shades, canopy_shape):
        mesh = bpy.data.meshes.new(name)
        obj = bpy.data.objects.new(name, mesh)
        coll.objects.link(obj)
        obj.location = loc
        bm = bmesh.new()

        trunk_h = 5.0 * scale
        trunk_r = 0.28 * scale

        bmesh.ops.create_cone(bm, segments=8, radius1=trunk_r, radius2=trunk_r * 0.55, depth=trunk_h, matrix=mathutils.Matrix.Translation((0, 0, trunk_h / 2)))

        if canopy_shape == 'conical':
            num_branches = random.randint(4, 5); spread = 0.5; up_bias = 0.7; leaf_r_range = (0.9, 1.4)
        elif canopy_shape == 'round':
            num_branches = random.randint(5, 7); spread = 0.85; up_bias = 0.45; leaf_r_range = (1.2, 1.9)
        else:
            num_branches = random.randint(4, 6); spread = 1.1; up_bias = 0.25; leaf_r_range = (1.3, 2.1)

        leaf_centres = []
        for i in range(num_branches):
            b_angle = (i / num_branches) * math.pi * 2 + random.uniform(-0.4, 0.4)
            bz = trunk_h * random.uniform(0.55, 0.88)
            bl = random.uniform(1.8, 3.0) * scale

            dx = math.sin(b_angle) * spread; dy = math.cos(b_angle) * spread; dz = up_bias + random.uniform(-0.1, 0.2)
            length = math.sqrt(dx**2 + dy**2 + dz**2)
            dx, dy, dz = dx / length, dy / length, dz / length

            sx, sy, sz = dx * trunk_r * 0.5, dy * trunk_r * 0.5, bz
            ex, ey, ez = sx + dx * bl, sy + dy * bl, sz + dz * bl

            mid = mathutils.Vector(((sx + ex) / 2, (sy + ey) / 2, (sz + ez) / 2))
            branch_vec = mathutils.Vector((dx, dy, dz))
            rot_mat = branch_vec.to_track_quat('Z', 'Y').to_matrix().to_4x4()
            trans_mat = mathutils.Matrix.Translation(mid)

            bmesh.ops.create_cone(bm, segments=5, radius1=trunk_r * 0.30, radius2=trunk_r * 0.10, depth=bl, matrix=trans_mat @ rot_mat)
            leaf_centres.append((ex, ey, ez))

            for _ in range(random.randint(1, 2)):
                sub_angle = b_angle + random.uniform(-0.8, 0.8)
                sdx = math.sin(sub_angle) * spread * 0.7; sdy = math.cos(sub_angle) * spread * 0.7; sdz = up_bias * 0.6 + random.uniform(0, 0.3)
                sl = math.sqrt(sdx**2 + sdy**2 + sdz**2)
                sdx, sdy, sdz = sdx / sl, sdy / sl, sdz / sl
                sbl = bl * random.uniform(0.45, 0.65)
                smid_x, smid_y, smid_z = ex + sdx * sbl / 2, ey + sdy * sbl / 2, ez + sdz * sbl / 2
                svec = mathutils.Vector((sdx, sdy, sdz))
                srot = svec.to_track_quat('Z', 'Y').to_matrix().to_4x4()
                strans = mathutils.Matrix.Translation((smid_x, smid_y, smid_z))
                bmesh.ops.create_cone(bm, segments=4, radius1=trunk_r * 0.15, radius2=trunk_r * 0.05, depth=sbl, matrix=strans @ srot)
                leaf_centres.append((ex + sdx * sbl, ey + sdy * sbl, ez + sdz * sbl))

        for (lx, ly, lz) in leaf_centres:
            lr = random.uniform(*leaf_r_range) * scale
            bmesh.ops.create_uvsphere(bm, u_segments=7, v_segments=5, radius=lr, matrix=mathutils.Matrix.Translation((lx, ly, lz)))

        bm.to_mesh(mesh); bm.free()

        mat_t = self._apply_mat(obj, "mat_trunk", (0.1, 0.05, 0.02, 1.0))
        mat_l = self._apply_mat(obj, f"mat_leaves_{name}", (*random.choice(shades), 1.0))
        
        cutoff_r = trunk_r * 3.5
        for poly in obj.data.polygons:
            c = poly.center
            xy_r = math.sqrt(c.x ** 2 + c.y ** 2)
            poly.material_index = 1 if (xy_r > cutoff_r and c.z > trunk_h * 0.45) else 0

    def _create_bush(self, name, loc, scale, coll, shades):
        mesh = bpy.data.meshes.new(name)
        obj = bpy.data.objects.new(name, mesh)
        coll.objects.link(obj)
        obj.location = loc
        obj.scale = (random.uniform(0.8, 1.2) * scale, random.uniform(0.8, 1.2) * scale, random.uniform(0.5, 0.9) * scale)
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=6, radius=1.5, matrix=mathutils.Matrix.Translation((0, 0, 0.75)))
        bm.to_mesh(mesh); bm.free()
        self._apply_mat(obj, f"mat_bush_{name}", (*random.choice(shades), 1.0))

    def _apply_mat(self, obj, name, color, alpha=False):
        if len(color) == 3: color = (*color, 1.0)
        mat = bpy.data.materials.get(name) or bpy.data.materials.new(name=name)
        if not mat.use_nodes: mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if bsdf: bsdf.inputs['Base Color'].default_value = color
        if alpha: mat.blend_method = 'BLEND'
        if mat.name not in obj.data.materials:
            obj.data.materials.append(mat)
        return mat

    def _link_to_coll(self, obj, coll):
        if obj.name not in coll.objects: coll.objects.link(obj)
        for c in list(obj.users_collection):
            if c != coll: c.objects.unlink(obj)

from registry import registry
registry.register_modeling("ExteriorModeler", ExteriorModeler)

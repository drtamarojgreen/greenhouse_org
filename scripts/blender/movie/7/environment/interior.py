import bpy
import bmesh
import math
import random
import json
import os
import mathutils
from base import Modeler

class InteriorModeler(Modeler):
    """OO Universal Modeler for the Interior Furnishing, matching Movie 7 requirements."""

    def validate_params(self, params):
        """Ensures required interior blocks are present (optional check)."""
        pass

    def build_mesh(self, char_id, params, rig=None):
        coll = bpy.data.collections.get("7b.ENVIRONMENT") or bpy.data.collections.new("7b.ENVIRONMENT")
        if coll.name not in bpy.context.scene.collection.children:
            bpy.context.scene.collection.children.link(coll)

        # Resolve config path
        from config import config
        m7_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        default_json = os.path.join(m7_root, "environment", "interior_assets.json")
        config_path = params.get("config_path", default_json)
        
        if not os.path.isabs(config_path):
            config_path = os.path.join(m7_root, config_path)

        if not os.path.exists(config_path):
            print(f"Warning: Interior config not found at {config_path}")
            return None

        with open(config_path, 'r') as f:
            assets_cfg = json.load(f)

        # Build categories
        self._build_racks(coll, assets_cfg.get("racks", []))
        self._build_flower_beds(coll, assets_cfg.get("flower_beds", []))
        self._build_potted_plants(coll, assets_cfg.get("potted_plants", []))
        self._build_chairs(coll, assets_cfg.get("chairs", []))
        self._build_end_tables(coll, assets_cfg.get("end_tables", []))
        
        stand_cfg = assets_cfg.get("television_stand")
        if stand_cfg:
            self._build_television_stand(coll, stand_cfg)
        
        tv_cfg = assets_cfg.get("television")
        if tv_cfg:
            self._build_television(coll, tv_cfg, assets_cfg.get("logo", {}))

        return None

    # --- Private builders ---

    def _build_racks(self, coll, racks_cfg):
        for cfg in racks_cfg:
            self._build_single_rack(coll, cfg)

    def _build_single_rack(self, coll, cfg):
        name = cfg["id"]
        mesh = bpy.data.meshes.new(name)
        obj = bpy.data.objects.new(name, mesh)
        self._link_to_coll(obj, coll)
        self._place_object(obj, cfg)
        
        p = cfg["params"]
        w, d, h = p["width"], p["depth"], p["height"]
        num_shelves = p["shelves"]
        
        bm = bmesh.new()
        # 4 vertical posts
        pw = 0.05
        posts = [(-w/2+pw, -d/2+pw), (w/2-pw, -d/2+pw), (-w/2+pw, d/2-pw), (w/2-pw, d/2-pw)]
        for px, py in posts:
            bmesh.ops.create_cube(bm, size=1.0, matrix=mathutils.Matrix.Translation((px, py, h/2)) @ mathutils.Matrix.Scale(pw*2, 4, (1,0,0)) @ mathutils.Matrix.Scale(pw*2, 4, (0,1,0)) @ mathutils.Matrix.Scale(h, 4, (0,0,1)))
        
        # Shelves
        for i in range(num_shelves):
            sz = (i / (num_shelves - 1)) * (h - 0.2) + 0.1
            bmesh.ops.create_cube(bm, size=1.0, matrix=mathutils.Matrix.Translation((0, 0, sz)) @ mathutils.Matrix.Scale(w, 4, (1,0,0)) @ mathutils.Matrix.Scale(d, 4, (0,1,0)) @ mathutils.Matrix.Scale(0.03, 4, (0,0,1)))
            
        bm.to_mesh(mesh)
        bm.free()
        
        self._apply_mat(obj, "mat_rack_frame", p["frame_color"])
        self._apply_mat(obj, "mat_rack_shelf", p["shelf_color"])
        
        for poly in obj.data.polygons:
            # If face is horizontal (ish) and not at extreme top/bottom of a post segment? 
            # Simple heuristic: if Z normal is high, it's a shelf or post cap.
            poly.material_index = 1 if abs(poly.normal.z) > 0.9 and poly.center.z < h - 0.1 else 0

    def _build_flower_beds(self, coll, beds_cfg):
        for cfg in beds_cfg:
            self._build_single_flower_bed(coll, cfg)

    def _build_single_flower_bed(self, coll, cfg):
        name = cfg["id"]
        mesh = bpy.data.meshes.new(name)
        obj = bpy.data.objects.new(name, mesh)
        self._link_to_coll(obj, coll)
        self._place_object(obj, cfg)
        
        p = cfg["params"]
        w, d, wh = p["width"], p["depth"], p["wall_height"]
        wt = 0.15 # wall thickness
        
        bm = bmesh.new()
        # Walls (4 slabs)
        # Front/Back
        for y in [-d/2 + wt/2, d/2 - wt/2]:
            bmesh.ops.create_cube(bm, size=1.0, matrix=mathutils.Matrix.Translation((0, y, wh/2)) @ mathutils.Matrix.Scale(w, 4, (1,0,0)) @ mathutils.Matrix.Scale(wt, 4, (0,1,0)) @ mathutils.Matrix.Scale(wh, 4, (0,0,1)))
        # Left/Right
        for x in [-w/2 + wt/2, w/2 - wt/2]:
            bmesh.ops.create_cube(bm, size=1.0, matrix=mathutils.Matrix.Translation((x, 0, wh/2)) @ mathutils.Matrix.Scale(wt, 4, (1,0,0)) @ mathutils.Matrix.Scale(d - 2*wt, 4, (0,1,0)) @ mathutils.Matrix.Scale(wh, 4, (0,0,1)))
            
        # Soil
        bmesh.ops.create_cube(bm, size=1.0, matrix=mathutils.Matrix.Translation((0, 0, wh*0.8)) @ mathutils.Matrix.Scale(w-wt, 4, (1,0,0)) @ mathutils.Matrix.Scale(d-wt, 4, (0,1,0)) @ mathutils.Matrix.Scale(0.05, 4, (0,0,1)))
        
        # Plants
        self._scatter_bed_plants(bm, p)
        
        bm.to_mesh(mesh)
        bm.free()
        
        self._apply_mat(obj, "mat_bed_wall", p["wall_color"])
        self._apply_mat(obj, "mat_bed_soil", p["soil_color"])
        self._apply_mat(obj, "mat_bed_plant", p["plant_colors"][0]) # Default first color
        
        for poly in obj.data.polygons:
            if poly.center.z > wh: # Plants
                poly.material_index = 2
            elif abs(poly.normal.z) > 0.9 and poly.center.z > wh*0.5 and poly.center.z < wh: # Soil
                poly.material_index = 1
            else: # Wall
                poly.material_index = 0

    def _scatter_bed_plants(self, bm, p):
        w, d, wh = p["width"], p["depth"], p["wall_height"]
        count = p.get("plant_density", 10)
        wt = 0.15
        for _ in range(count):
            px = random.uniform(-w/2 + wt, w/2 - wt)
            py = random.uniform(-d/2 + wt, d/2 - wt)
            ph = random.uniform(0.1, 0.3)
            # Cone plant
            bmesh.ops.create_cone(bm, segments=6, radius1=0.05, radius2=0, depth=ph, matrix=mathutils.Matrix.Translation((px, py, wh + ph/2)))

    def _build_potted_plants(self, coll, pots_cfg):
        for cfg in pots_cfg:
            self._build_single_pot(coll, cfg)

    def _build_single_pot(self, coll, cfg):
        name = cfg["id"]
        mesh = bpy.data.meshes.new(name)
        obj = bpy.data.objects.new(name, mesh)
        self._link_to_coll(obj, coll)
        self._place_object(obj, cfg)
        
        p = cfg["params"]
        r, h = p["pot_radius"], p["pot_height"]
        
        bm = bmesh.new()
        # Pot body (truncated cone)
        bmesh.ops.create_cone(bm, segments=16, radius1=r*0.7, radius2=r, depth=h, matrix=mathutils.Matrix.Translation((0, 0, h/2)))
        # Rim
        bmesh.ops.create_cone(bm, segments=16, radius1=r*1.1, radius2=r*1.1, depth=0.05, matrix=mathutils.Matrix.Translation((0, 0, h - 0.025)))
        
        # Plant
        ph = 0.5 * p.get("plant_scale", 1.0)
        if p.get("plant_type") == "bush":
            bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=6, radius=ph, matrix=mathutils.Matrix.Translation((0, 0, h + ph*0.6)))
        else:
            bmesh.ops.create_cone(bm, segments=8, radius1=0.05, radius2=0, depth=ph*2, matrix=mathutils.Matrix.Translation((0, 0, h + ph)))
            
        bm.to_mesh(mesh)
        bm.free()
        
        self._apply_mat(obj, "mat_pot", p["pot_color"])
        self._apply_mat(obj, "mat_pot_plant", p["plant_color"])
        
        for poly in obj.data.polygons:
            poly.material_index = 1 if poly.center.z > h else 0

    def _build_chairs(self, coll, chairs_cfg):
        for cfg in chairs_cfg:
            self._build_single_chair(coll, cfg)

    def _build_single_chair(self, coll, cfg):
        name = cfg["id"]
        mesh = bpy.data.meshes.new(name)
        obj = bpy.data.objects.new(name, mesh)
        self._link_to_coll(obj, coll)
        self._place_object(obj, cfg)
        
        p = cfg["params"]
        bm = bmesh.new()
        # Seat
        sw, sd, sh = 0.5, 0.5, 0.45
        bmesh.ops.create_cube(bm, size=1.0, matrix=mathutils.Matrix.Translation((0, 0, sh)) @ mathutils.Matrix.Scale(sw, 4, (1,0,0)) @ mathutils.Matrix.Scale(sd, 4, (0,1,0)) @ mathutils.Matrix.Scale(0.08, 4, (0,0,1)))
        
        # Legs
        lw = 0.04
        for lx, ly in [(-sw/2.2, -sd/2.2), (sw/2.2, -sd/2.2), (-sw/2.2, sd/2.2), (sw/2.2, sd/2.2)]:
            bmesh.ops.create_cube(bm, size=1.0, matrix=mathutils.Matrix.Translation((lx, ly, sh/2)) @ mathutils.Matrix.Scale(lw, 4, (1,0,0)) @ mathutils.Matrix.Scale(lw, 4, (0,1,0)) @ mathutils.Matrix.Scale(sh, 4, (0,0,1)))
            
        # Back
        bh = 0.5
        bmesh.ops.create_cube(bm, size=1.0, matrix=mathutils.Matrix.Translation((0, sd/2, sh + bh/2)) @ mathutils.Matrix.Scale(sw, 4, (1,0,0)) @ mathutils.Matrix.Scale(0.06, 4, (0,1,0)) @ mathutils.Matrix.Scale(bh, 4, (0,0,1)))
        
        # Cushion
        if p.get("cushion"):
            bmesh.ops.create_cube(bm, size=1.0, matrix=mathutils.Matrix.Translation((0, 0, sh + 0.05)) @ mathutils.Matrix.Scale(sw*0.9, 4, (1,0,0)) @ mathutils.Matrix.Scale(sd*0.9, 4, (0,1,0)) @ mathutils.Matrix.Scale(0.06, 4, (0,0,1)))
            
        bm.to_mesh(mesh)
        bm.free()
        
        self._apply_mat(obj, "mat_chair_frame", p["frame_color"])
        self._apply_mat(obj, "mat_chair_seat", p["seat_color"])
        
        for poly in obj.data.polygons:
            # Heuristic: if Z is high (seat/cushion) or Y is back-aligned
            if poly.center.z > sh - 0.01 and abs(poly.normal.z) > 0.5:
                poly.material_index = 1
            else:
                poly.material_index = 0

    def _build_end_tables(self, coll, tables_cfg):
        for cfg in tables_cfg:
            self._build_single_end_table(coll, cfg)

    def _build_single_end_table(self, coll, cfg):
        name = cfg["id"]
        mesh = bpy.data.meshes.new(name)
        obj = bpy.data.objects.new(name, mesh)
        self._link_to_coll(obj, coll)
        self._place_object(obj, cfg)
        
        p = cfg["params"]
        r, h = p["top_radius"], p["height"]
        num_legs = p.get("legs", 4)
        
        bm = bmesh.new()
        # Top
        bmesh.ops.create_cone(bm, segments=32, radius1=r, radius2=r, depth=0.04, matrix=mathutils.Matrix.Translation((0, 0, h)))
        
        # Legs
        lw = 0.03
        for i in range(num_legs):
            angle = (i / num_legs) * math.pi * 2
            lx, ly = math.sin(angle) * r * 0.7, math.cos(angle) * r * 0.7
            # Angled legs? No, vertical is easier.
            bmesh.ops.create_cone(bm, segments=8, radius1=lw, radius2=lw, depth=h, matrix=mathutils.Matrix.Translation((lx, ly, h/2)))
            
        bm.to_mesh(mesh)
        bm.free()
        
        self._apply_mat(obj, "mat_table_top", p["top_color"])
        self._apply_mat(obj, "mat_table_legs", p["leg_color"])
        
        for poly in obj.data.polygons:
            poly.material_index = 0 if poly.center.z > h - 0.05 else 1

    def _build_television_stand(self, coll, cfg):
        name = cfg["id"]
        mesh = bpy.data.meshes.new(name)
        obj = bpy.data.objects.new(name, mesh)
        self._link_to_coll(obj, coll)
        self._place_object(obj, cfg)
        
        p = cfg["params"]
        w, d, h = p["width"], p["depth"], p["height"]
        
        bm = bmesh.new()
        # Main body
        bmesh.ops.create_cube(bm, size=1.0, matrix=mathutils.Matrix.Translation((0, 0, h/2)) @ mathutils.Matrix.Scale(w, 4, (1,0,0)) @ mathutils.Matrix.Scale(d, 4, (0,1,0)) @ mathutils.Matrix.Scale(h, 4, (0,0,1)))
        
        # Recessed doors (simplified as inset faces)
        # Actually, let's just use material indices.
        
        bm.to_mesh(mesh)
        bm.free()
        
        self._apply_mat(obj, "mat_tv_stand", p["cabinet_color"])
        self._apply_mat(obj, "mat_tv_doors", p["door_color"])
        
        for poly in obj.data.polygons:
            # Front face (Y positive or negative? TV stand is at y=17, facing -Y)
            if poly.normal.y < -0.9: # Front
                poly.material_index = 1
            else:
                poly.material_index = 0

    def _build_television(self, coll, tv_cfg, logo_cfg):
        name = tv_cfg["id"]
        mesh = bpy.data.meshes.new(name)
        obj = bpy.data.objects.new(name, mesh)
        self._link_to_coll(obj, coll)
        self._place_object(obj, tv_cfg)
        
        p = tv_cfg["params"]
        sw, sh, d = p["screen_width"], p["screen_height"], p["depth"]
        bw = 0.05 # bezel
        
        bm = bmesh.new()
        # TV Body
        bmesh.ops.create_cube(bm, size=1.0, matrix=mathutils.Matrix.Translation((0, 0, sh/2 + p.get("stand_height", 0.1))) @ mathutils.Matrix.Scale(sw + 2*bw, 4, (1,0,0)) @ mathutils.Matrix.Scale(d, 4, (0,1,0)) @ mathutils.Matrix.Scale(sh + 2*bw, 4, (0,0,1)))
        
        # Screen face
        bmesh.ops.create_cube(bm, size=1.0, matrix=mathutils.Matrix.Translation((0, -d/2 - 0.001, sh/2 + p.get("stand_height", 0.1))) @ mathutils.Matrix.Scale(sw, 4, (1,0,0)) @ mathutils.Matrix.Scale(0.005, 4, (0,1,0)) @ mathutils.Matrix.Scale(sh, 4, (0,0,1)))
        
        bm.to_mesh(mesh)
        bm.free()
        
        self._apply_mat(obj, "mat_tv_bezel", p["bezel_color"])
        
        # Screen Material with Emission
        mat_screen = bpy.data.materials.new(name="mat_tv_screen")
        mat_screen.use_nodes = True
        nodes = mat_screen.node_tree.nodes
        nodes.clear()
        n_out = nodes.new(type='ShaderNodeOutputMaterial')
        n_emit = nodes.new(type='ShaderNodeEmission')
        n_emit.inputs['Color'].default_value = (*logo_cfg.get("background_color", [0,0,0]), 1.0)
        n_emit.inputs['Strength'].default_value = p.get("screen_emission_strength", 5.0)
        mat_screen.node_tree.links.new(n_emit.outputs['Emission'], n_out.inputs['Surface'])
        obj.data.materials.append(mat_screen)
        
        for poly in obj.data.polygons:
            poly.material_index = 1 if poly.normal.y < -0.9 else 0
            
        # Logo Text
        self._build_logo(obj, logo_cfg, p)

    def _build_logo(self, parent_obj, cfg, tv_p):
        text = cfg.get("text", "GreenhouseMD")
        font_curve = bpy.data.curves.new(type="FONT", name="logo_font")
        font_curve.body = text
        font_obj = bpy.data.objects.new("tv_logo", font_curve)
        
        # Link to same collection
        for coll in parent_obj.users_collection:
            coll.objects.link(font_obj)
            
        font_obj.parent = parent_obj
        # Position flush with screen
        sw, sh = tv_p["screen_width"], tv_p["screen_height"]
        # FONT objects are usually XY-aligned. We need to rotate to face -Y.
        font_obj.rotation_euler = (math.radians(90), 0, 0)
        # Center the text (rough approximation)
        font_obj.location = (-sw*0.4, -tv_p["depth"]/2 - 0.005, tv_p.get("stand_height", 0.1) + sh*0.4)
        
        s = cfg.get("scale", [1,1,1])
        font_obj.scale = (0.2 * s[0], 0.2 * s[1], 0.2 * s[2])
        
        mat = bpy.data.materials.new(name="mat_tv_logo")
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        nodes.clear()
        n_out = nodes.new(type='ShaderNodeOutputMaterial')
        n_emit = nodes.new(type='ShaderNodeEmission')
        n_emit.inputs['Color'].default_value = (*cfg.get("color", [0,1,0]), 1.0)
        n_emit.inputs['Strength'].default_value = cfg.get("emission_strength", 8.0)
        mat.node_tree.links.new(n_emit.outputs['Emission'], n_out.inputs['Surface'])
        font_obj.data.materials.append(mat)
        
        # Animation
        if cfg.get("animate"):
            from config import config
            total_f = config.total_frames
            freq = cfg.get("pulse_freq", 0.5)
            amp = cfg.get("pulse_amp", 2.0)
            base_strength = cfg.get("emission_strength", 8.0)
            
            for f in range(1, total_f + 1, 5):
                # Strength = base + amp * sin(2pi * freq * t)
                t = f / 24.0
                strength = base_strength + amp * math.sin(2 * math.pi * freq * t)
                n_emit.inputs['Strength'].default_value = strength
                n_emit.inputs['Strength'].keyframe_insert(data_path="default_value", frame=f)

    # --- Shared helpers ---

    def _apply_mat(self, obj, name, color, emission=0.0, alpha=False):
        if len(color) == 3: color = (*color, 1.0)
        mat = bpy.data.materials.get(name) or bpy.data.materials.new(name=name)
        if not mat.use_nodes: mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if bsdf: 
            bsdf.inputs['Base Color'].default_value = color
            if emission > 0:
                if 'Emission Strength' in bsdf.inputs:
                    bsdf.inputs['Emission Strength'].default_value = emission
                    bsdf.inputs['Emission Color'].default_value = color
        if alpha: mat.blend_method = 'BLEND'
        if mat.name not in obj.data.materials:
            obj.data.materials.append(mat)
        return mat

    def _link_to_coll(self, obj, coll):
        if obj.name not in coll.objects: coll.objects.link(obj)
        for c in list(obj.users_collection):
            if c != coll: c.objects.unlink(obj)

    def _place_object(self, obj, cfg):
        obj.location = cfg.get("pos", (0,0,0))
        if "rot" in cfg:
            obj.rotation_euler = [math.radians(r) for r in cfg["rot"]]
        if "scale" in cfg:
            obj.scale = cfg["scale"]

from registry import registry
registry.register_modeling("InteriorModeler", InteriorModeler)

import bpy
import bmesh
import mathutils
import math
import random
import os
from .config import config

class Character:
    """Base OO Character class for Movie 7 modular framework."""
    def __init__(self, char_id, cfg):
        self.char_id = char_id
        self.cfg = cfg
        self.rig = None
        self.mesh = None

    def build(self, manager):
        """Main entry point for character construction."""
        raise NotImplementedError("Characters must implement a build method.")

    def apply_initial_pose(self):
        """Applies the default transformation defined in the configuration."""
        if self.rig:
            self.rig.location = self.cfg.get("default_pos", (0, 0, 0))

class MeshCharacter(Character):
    """Character derived from external mesh and armature assets."""
    def build(self, manager):
        source_mesh = self.cfg.get("source_mesh")
        source_rig = self.cfg.get("source_rig")
        targets = [t for t in [source_mesh, source_rig] if t]

        objs = manager.link_assets(config.assets_blend, targets)
        for obj in objs:
            if obj.type == 'ARMATURE':
                self.rig = obj
                manager.apply_standard_renaming(obj, self.char_id, is_rig=True)
            elif obj.type == 'MESH':
                self.mesh = obj
                manager.apply_standard_renaming(obj, self.char_id, is_rig=False)

        if self.rig and self.cfg.get("target_height"):
            manager.normalize_character(self.rig, self.cfg["target_height"])

class ProceduralCharacterBuilder:
    """Robust procedural character generator synchronized with Movie 6 standards."""

    def __init__(self, char_id, params):
        self.char_id = char_id
        self.params = params
        dims = params.get("dimensions", {})
        self.torso_h = dims.get("torso_h", 1.5)
        self.head_r = dims.get("head_r", 0.4)
        self.neck_h = dims.get("neck_h", 0.2)

    def create(self, manager):
        """Executes the full production-grade building sequence."""
        self.rig = self._create_armature()
        self.mesh = self._create_mesh()
        self._setup_materials()
        self._create_facial_props()
        self._apply_initial_pose()
        return self.rig, self.mesh

    def _create_armature(self):
        arm_data = bpy.data.armatures.new(f"{self.char_id}_ArmatureData")
        rig = bpy.data.objects.new(f"{self.char_id}.Rig", arm_data)
        bpy.context.scene.collection.objects.link(rig)

        bpy.context.view_layer.objects.active = rig
        bpy.ops.object.mode_set(mode='EDIT')

        bones_def = {
            "Torso": ((0,0,0), (0,0,self.torso_h), None),
            "Neck":  ((0,0,self.torso_h), (0,0,self.torso_h+self.neck_h), "Torso"),
            "Head":  ((0,0,self.torso_h+self.neck_h), (0,0,self.torso_h+self.neck_h+self.head_r*2), "Neck"),
            "Shoulder.L": ((0.2, 0, self.torso_h*0.9), (0.4, 0, self.torso_h*0.9), "Torso"),
            "Arm.L":      ((0.4, 0, self.torso_h*0.9), (0.4, 0, self.torso_h*0.9-0.4), "Shoulder.L"),
            "Elbow.L":    ((0.4, 0, self.torso_h*0.9-0.4), (0.4, 0, self.torso_h*0.9-0.8), "Arm.L"),
            "Hand.L":     ((0.4, 0, self.torso_h*0.9-0.8), (0.4, 0, self.torso_h*0.9-0.95), "Elbow.L"),
            "Shoulder.R": ((-0.2, 0, self.torso_h*0.9), (-0.4, 0, self.torso_h*0.9), "Torso"),
            "Arm.R":      ((-0.4, 0, self.torso_h*0.9), (-0.4, 0, self.torso_h*0.9-0.4), "Shoulder.R"),
            "Elbow.R":    ((-0.4, 0, self.torso_h*0.9-0.4), (-0.4, 0, self.torso_h*0.9-0.8), "Arm.R"),
            "Hand.R":     ((-0.4, 0, self.torso_h*0.9-0.8), ((-0.4, 0, self.torso_h*0.9-0.95)), "Elbow.R"),
            "Hip.L":   ((0.15, 0, 0.1), (0.25, 0, 0.1), "Torso"),
            "Thigh.L": ((0.25, 0, 0.1), (0.25, 0, -0.4), "Hip.L"),
            "Knee.L":  ((0.25, 0, -0.4), (0.25, 0, -0.9), "Thigh.L"),
            "Foot.L":  ((0.25, 0, -0.9), (0.25,-0.15,-0.95), "Knee.L"),
            "Hip.R":   ((-0.15, 0, 0.1), (-0.25, 0, 0.1), "Torso"),
            "Thigh.R": ((-0.25, 0, 0.1), (-0.25, 0, -0.4), "Hip.R"),
            "Knee.R":  ((-0.25, 0, -0.4), (-0.25, 0, -0.9), "Thigh.R"),
            "Foot.R":  ((-0.25, 0, -0.9), ((-0.25,-0.15,-0.95)), "Knee.R"),
        }

        facial_bones = ["Eye.L", "Eye.R", "Eyelid.Upper.L", "Eyelid.Lower.L", "Eyelid.Upper.R", "Eyelid.Lower.R", "Nose", "Lip.Upper", "Lip.Lower", "Ear.L", "Ear.R", "Chin"]
        for bname in facial_bones:
            hcz = self.torso_h + self.neck_h + self.head_r
            bones_def[bname] = ((0, -self.head_r, hcz), (0, -self.head_r - 0.1, hcz), "Head")

        for bname, (h, t, p) in bones_def.items():
            bone = arm_data.edit_bones.new(bname)
            bone.head, bone.tail = h, t
            if p: bone.parent = arm_data.edit_bones[p]
            bone.use_deform = True if bname not in facial_bones else False

        bpy.ops.object.mode_set(mode='OBJECT')
        return rig

    def _create_mesh(self):
        mesh_data = bpy.data.meshes.new(f"{self.char_id}_MeshData")
        mesh = bpy.data.objects.new(f"{self.char_id}.Body", mesh_data)
        bpy.context.scene.collection.objects.link(mesh)
        mesh.parent = self.rig

        bm = bmesh.new()
        dlayer = bm.verts.layers.deform.verify()

        def add_organic_part(bm, rad1, rad2, h, loc, bname, rot=(0,0,0)):
            vg = mesh.vertex_groups.get(bname) or mesh.vertex_groups.new(name=bname)
            matrix = mathutils.Matrix.Translation(loc) @ mathutils.Euler(rot).to_matrix().to_4x4()
            ret = bmesh.ops.create_cone(bm, segments=24, cap_ends=True, radius1=rad1, radius2=rad2, depth=h, matrix=matrix)
            for v in ret['verts']: v[dlayer][vg.index] = 1.0
            for f in bm.faces: f.smooth = True

        # Torso and Neck
        add_organic_part(bm, 0.5, 0.25, self.torso_h, (0, 0, self.torso_h/2), "Torso")
        add_organic_part(bm, 0.15, 0.12, self.neck_h, (0, 0, self.torso_h+self.neck_h/2), "Neck")

        # Head sphere
        ret_head = bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=32, radius=self.head_r, matrix=mathutils.Matrix.Translation((0, 0, self.torso_h+self.neck_h+self.head_r)))
        head_vg = mesh.vertex_groups.get("Head") or mesh.vertex_groups.new(name="Head")
        for v in ret_head['verts']: v[dlayer][head_vg.index] = 1.0

        # Full Limbs implementation matching Movie 6
        for side, sx in [("L", 1), ("R", -1)]:
            # Arms
            s_loc = (0.4*sx, 0, self.torso_h*0.9)
            e_loc = (0.4*sx, 0, self.torso_h*0.9-0.4)
            h_loc = (0.4*sx, 0, self.torso_h*0.9-0.8)
            add_organic_part(bm, 0.14, 0.11, 0.4, (s_loc[0], s_loc[1], s_loc[2]-0.2), f"Arm.{side}")
            add_organic_part(bm, 0.11, 0.08, 0.4, (e_loc[0], e_loc[1], e_loc[2]-0.2), f"Elbow.{side}")
            add_organic_part(bm, 0.08, 0.12, 0.15, (h_loc[0], h_loc[1], h_loc[2]-0.07), f"Hand.{side}")

            # Legs
            hi_loc = (0.25*sx, 0, 0.1)
            k_loc  = (0.25*sx, 0, -0.4)
            an_loc = (0.25*sx, 0, -0.9)
            add_organic_part(bm, 0.2, 0.16, 0.5, (hi_loc[0], hi_loc[1], hi_loc[2]-0.25), f"Thigh.{side}")
            add_organic_part(bm, 0.16, 0.12, 0.5, (k_loc[0], k_loc[1], k_loc[2]-0.25), f"Knee.{side}")
            add_organic_part(bm, 0.1, 0.15, 0.25, (an_loc[0], an_loc[1]-0.15, an_loc[2]), f"Foot.{side}", rot=(math.radians(90), 0, 0))

        # High-Fidelity Foliage System
        foliage_cfg = self.params.get("foliage", {})
        density = foliage_cfg.get("density", 20)
        head_center = mathutils.Vector((0, 0, self.torso_h+self.neck_h+self.head_r))

        for i in range(density):
            angle = (i/density)*math.pi*2
            tilt = random.uniform(0.2, 0.8)
            loc = head_center + mathutils.Vector((math.cos(angle)*self.head_r*tilt, math.sin(angle)*self.head_r*tilt, self.head_r*0.5 + random.uniform(0, self.head_r)))
            if loc.y < head_center.y - 0.05: continue

            dir_vec = (loc - head_center).normalized()
            b_len = random.uniform(0.4, 0.8)
            b_ret = bmesh.ops.create_cone(bm, segments=6, cap_ends=True, radius1=0.03, radius2=0.005, depth=b_len, matrix=(mathutils.Matrix.Translation(loc + dir_vec*(b_len/2)) @ dir_vec.to_track_quat('Z', 'Y').to_matrix().to_4x4()))
            for v in b_ret['verts']: v[dlayer][head_vg.index] = 1.0

        bm.to_mesh(mesh_data)
        bm.free()
        mesh.modifiers.new(name="Armature", type='ARMATURE').object = self.rig
        return mesh

    def _setup_materials(self):
        mats = self.params.get("materials", {})
        bark_color = mats.get("bark_color", (0.2, 0.12, 0.08))
        leaf_color = mats.get("leaf_color", (0.2, 0.6, 0.1))

        bark_mat = bpy.data.materials.new(name=f"Bark_{self.char_id}")
        bark_mat.use_nodes = True
        bark_mat.node_tree.nodes["Principled BSDF"].inputs['Base Color'].default_value = (*bark_color, 1)
        self.mesh.data.materials.append(bark_mat)

        leaf_mat = bpy.data.materials.new(name=f"Leaf_{self.char_id}")
        leaf_mat.use_nodes = True
        leaf_mat.node_tree.nodes["Principled BSDF"].inputs['Base Color'].default_value = (*leaf_color, 1)
        self.mesh.data.materials.append(leaf_mat)

    def _create_facial_props(self):
        """Robust facial prop generation matching Movie 6 fidelity."""
        bark_mat = self.mesh.data.materials[0]
        eye_r = 0.065

        for side in ("L", "R"):
            # Eyeball
            eb_mesh = bpy.data.meshes.new(f"{self.char_id}_Eye_{side}")
            eb_obj = bpy.data.objects.new(f"{self.char_id}_Eye_{side}", eb_mesh)
            bpy.context.scene.collection.objects.link(eb_obj)
            eb_obj.parent = self.rig
            eb_obj.parent_type = 'BONE'
            eb_obj.parent_bone = f"Eye.{side}"
            eb_obj.location = (0, 0, 0)
            bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=32, radius=eye_r); bm.to_mesh(eb_mesh); bm.free()

            # Eyelids
            for part in ("Upper", "Lower"):
                el_mesh = bpy.data.meshes.new(f"{self.char_id}_Lid_{part}_{side}")
                el_obj = bpy.data.objects.new(f"{self.char_id}_Lid_{part}_{side}", el_mesh)
                bpy.context.scene.collection.objects.link(el_obj)
                el_obj.parent = self.rig
                el_obj.parent_type = 'BONE'
                el_obj.parent_bone = f"Eyelid.{part}.{side}"
                el_obj.location = (0, 0, 0)
                bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=32, radius=eye_r * 1.15)
                to_del = [v for v in bm.verts if (v.co.z < 0.01 if part == "Upper" else v.co.z > -0.01)]
                bmesh.ops.delete(bm, geom=to_del, context='VERTS'); bm.to_mesh(el_mesh); bm.free()
                el_obj.data.materials.append(bark_mat)

    def _apply_initial_pose(self):
        bpy.context.view_layer.objects.active = self.rig
        bpy.ops.object.mode_set(mode='POSE')
        for pb in self.rig.pose.bones:
            pb.rotation_mode = 'XYZ'
        bpy.ops.object.mode_set(mode='OBJECT')

class DynamicCharacter(Character):
    """Procedurally generated character using ProceduralCharacterBuilder."""
    def build(self, manager):
        builder_type = self.cfg.get("builder")
        params = self.cfg.get("parameters", {})

        if builder_type == "ProceduralCharacter":
            builder = ProceduralCharacterBuilder(self.char_id, params)
            self.rig, self.mesh = builder.create(manager)

            coll = manager.ensure_collection(config.coll_assets)
            if self.rig.name not in coll.objects: coll.objects.link(self.rig)
            if self.mesh.name not in coll.objects: coll.objects.link(self.mesh)

            if self.cfg.get("target_height"):
                manager.normalize_character(self.rig, self.cfg["target_height"])

class CharacterBuilder:
    """Factory for modular character creation."""
    @staticmethod
    def create(char_id, cfg):
        ctype = cfg.get("type", "MESH")
        if ctype == "MESH":
            return MeshCharacter(char_id, cfg)
        elif ctype == "DYNAMIC":
            return DynamicCharacter(char_id, cfg)
        return Character(char_id, cfg)

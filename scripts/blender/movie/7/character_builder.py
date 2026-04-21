import bpy
import bmesh
import mathutils
import math
import random
import os
from .config import config

class Character:
    """Base OO Character class."""
    def __init__(self, char_id, cfg):
        self.char_id = char_id
        self.cfg = cfg
        self.rig = None
        self.mesh = None

    def build(self, manager):
        raise NotImplementedError()

    def apply_initial_pose(self):
        if self.rig:
            self.rig.location = self.cfg.get("default_pos", (0, 0, 0))

class MeshCharacter(Character):
    """Character loaded from mesh/rig in a blend file."""
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

class PlantHumanoidBuilder:
    """Procedural generator for plant-based humanoids."""

    def __init__(self, char_id, parameters):
        self.char_id = char_id
        self.params = parameters

    def create(self, manager):
        torso_h, head_r, neck_h = 1.5, 0.4, 0.2
        rig = self._create_armature(torso_h, head_r, neck_h)
        mesh = self._create_mesh(rig, torso_h, head_r, neck_h)
        self._apply_materials(mesh)
        return rig, mesh

    def _create_armature(self, torso_h, head_r, neck_h):
        arm_data = bpy.data.armatures.new(f"{self.char_id}_ArmData")
        rig = bpy.data.objects.new(f"{self.char_id}.Rig", arm_data)
        bpy.context.scene.collection.objects.link(rig)

        bpy.context.view_layer.objects.active = rig
        bpy.ops.object.mode_set(mode='EDIT')

        bones = {
            "Torso": ((0,0,0), (0,0,torso_h), None),
            "Neck":  ((0,0,torso_h), (0,0,torso_h+neck_h), "Torso"),
            "Head":  ((0,0,torso_h+neck_h), (0,0,torso_h+neck_h+head_r*2), "Neck")
        }
        for bname, (h, t, p) in bones.items():
            bone = arm_data.edit_bones.new(bname)
            bone.head, bone.tail = h, t
            if p: bone.parent = arm_data.edit_bones[p]

        bpy.ops.object.mode_set(mode='OBJECT')
        return rig

    def _create_mesh(self, rig, torso_h, head_r, neck_h):
        mesh_data = bpy.data.meshes.new(f"{self.char_id}_MeshData")
        mesh = bpy.data.objects.new(f"{self.char_id}.Body", mesh_data)
        bpy.context.scene.collection.objects.link(mesh)
        mesh.parent = rig

        bm = bmesh.new()
        # Simple torso/head geometry
        bmesh.ops.create_cone(bm, segments=12, radius1=0.5, radius2=0.3, depth=torso_h, matrix=mathutils.Matrix.Translation((0,0,torso_h/2)))
        bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=16, radius=head_r, matrix=mathutils.Matrix.Translation((0,0,torso_h+neck_h+head_r)))

        bm.to_mesh(mesh_data)
        bm.free()

        mesh.modifiers.new(name="Armature", type='ARMATURE').object = rig
        return mesh

    def _apply_materials(self, mesh):
        bark_color = self.params.get("bark_color", (0.2, 0.12, 0.08))
        mat = bpy.data.materials.new(name=f"Bark_{self.char_id}")
        mat.use_nodes = True
        mat.node_tree.nodes["Principled BSDF"].inputs['Base Color'].default_value = (*bark_color, 1)
        mesh.data.materials.append(mat)

class DynamicCharacter(Character):
    """Procedurally generated character."""
    def build(self, manager):
        builder_type = self.cfg.get("builder")
        params = self.cfg.get("parameters", {})

        if builder_type == "PlantHumanoid":
            builder = PlantHumanoidBuilder(self.char_id, params)
            self.rig, self.mesh = builder.create(manager)

            coll = manager.ensure_collection(config.coll_assets)
            if self.rig.name not in coll.objects: coll.objects.link(self.rig)
            if self.mesh.name not in coll.objects: coll.objects.link(self.mesh)

            if self.cfg.get("target_height"):
                manager.normalize_character(self.rig, self.cfg["target_height"])

class CharacterBuilder:
    """Factory for character creation."""
    @staticmethod
    def create(char_id, cfg):
        ctype = cfg.get("type", "MESH")
        if ctype == "MESH":
            return MeshCharacter(char_id, cfg)
        elif ctype == "DYNAMIC":
            return DynamicCharacter(char_id, cfg)
        return Character(char_id, cfg)

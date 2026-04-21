import bpy
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
            manager.normalize_scale(self.rig, self.cfg["target_height"])

class DynamicCharacter(Character):
    """Procedurally generated character."""
    def build(self, manager):
        builder_type = self.cfg.get("builder")
        if builder_type == "PlantHumanoid":
            # In a real implementation, we would call the procedural generator
            # For Movie 7, we'll implement a simplified placeholder or bridge
            print(f"Building dynamic {self.char_id} using {builder_type}")
            # Placeholder: create a basic armature and mesh
            bpy.ops.object.armature_add()
            self.rig = bpy.context.active_object
            self.rig.name = f"{self.char_id}.Rig"

            bpy.ops.mesh.primitive_monkey_add()
            self.mesh = bpy.context.active_object
            self.mesh.name = f"{self.char_id}.Body"
            self.mesh.parent = self.rig

            coll = manager.ensure_collection(config.coll_assets)
            if self.rig.name not in coll.objects: coll.objects.link(self.rig)
            if self.mesh.name not in coll.objects: coll.objects.link(self.mesh)

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

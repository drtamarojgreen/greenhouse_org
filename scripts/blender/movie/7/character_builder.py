import bpy
import os
from .config import config
from .registry import registry
from . import components # Import triggers registration

class Character:
    """Modular, strictly OO Character."""
    def __init__(self, char_id, cfg):
        self.char_id = char_id
        self.cfg = cfg
        self.rig = None
        self.mesh = None

        # Resolve components via config strings and registry
        c_cfg = cfg.get("components", {})
        self.modeler = self._resolve(registry.get_modeling, c_cfg.get("modeling"))
        self.rigger = self._resolve(registry.get_rigging, c_cfg.get("rigging"))
        self.shader = self._resolve(registry.get_shading, c_cfg.get("shading"))
        self.animator = self._resolve(registry.get_animation, c_cfg.get("animation"))

    def _resolve(self, registry_func, name):
        cls = registry_func(name) if name else None
        return cls() if cls else None

    def build(self, manager):
        raise NotImplementedError()

    def apply_pose(self):
        if self.rig:
            self.rig.location = self.cfg.get("default_pos", (0, 0, 0))

class DynamicCharacter(Character):
    """Component-based procedural character."""
    def build(self, manager):
        params = self.cfg.get("parameters", {})
        if self.rigger: self.rig = self.rigger.build_rig(self.char_id, params)
        if self.modeler: self.mesh = self.modeler.build_mesh(self.char_id, params)

        if self.mesh and self.rig:
            self.mesh.parent = self.rig
            self.mesh.modifiers.new(name="Armature", type='ARMATURE').object = self.rig

        if self.mesh and self.shader: self.shader.apply_materials(self.mesh, params)
        if self.rig and self.cfg.get("target_height"):
            manager.normalize_character(self.rig, self.cfg["target_height"])

class MeshCharacter(Character):
    """Linked asset character."""
    def build(self, manager):
        targets = [t for t in [self.cfg.get("source_mesh"), self.cfg.get("source_rig")] if t]
        objs = manager.link_assets(config.assets_blend, targets)
        for obj in objs:
            if obj.type == 'ARMATURE': self.rig = obj; manager.apply_standard_renaming(obj, self.char_id, is_rig=True)
            elif obj.type == 'MESH': self.mesh = obj; manager.apply_standard_renaming(obj, self.char_id, is_rig=False)
        if self.rig and self.cfg.get("target_height"):
            manager.normalize_character(self.rig, self.cfg["target_height"])

class CharacterBuilder:
    @staticmethod
    def create(char_id, cfg):
        return DynamicCharacter(char_id, cfg) if cfg.get("type") == "DYNAMIC" else MeshCharacter(char_id, cfg)

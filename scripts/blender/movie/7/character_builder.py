import bpy
import os
import sys

# Ensure Movie 7 root is in sys.path
M7_ROOT = os.path.dirname(os.path.abspath(__file__))
if M7_ROOT not in sys.path:
    sys.path.insert(0, M7_ROOT)

import config
from registry import registry
import components

class Character:
    """Modular, strictly OO Character with robust component resolution."""
    def __init__(self, char_id, cfg):
        self.char_id = char_id
        self.cfg = cfg
        self.rig = None
        self.mesh = None

        c_cfg = cfg.get("components", {})
        self.modeler = self._resolve(registry.get_modeling, c_cfg.get("modeling"), "Modeling")
        self.rigger = self._resolve(registry.get_rigging, c_cfg.get("rigging"), "Rigging")
        self.shader = self._resolve(registry.get_shading, c_cfg.get("shading"), "Shading")
        self.animator = self._resolve(registry.get_animation, c_cfg.get("animation"), "Animation")

    def _resolve(self, registry_func, name, type_label):
        if not name: return None
        cls = registry_func(name)
        if not cls:
            print(f"ERROR: Could not resolve {type_label} component '{name}' for character '{self.char_id}'")
            return None
        try:
            return cls()
        except Exception as e:
            print(f"ERROR: Failed to instantiate {type_label} component '{name}' for '{self.char_id}': {e}")
            return None

    def build(self, manager): raise NotImplementedError()

    def apply_pose(self):
        if self.rig: self.rig.location = self.cfg.get("default_pos", (0, 0, 0))

class DynamicCharacter(Character):
    def build(self, manager):
        params = self.cfg.get("parameters", {})
        if self.rigger: self.rig = self.rigger.build_rig(self.char_id, params)
        if self.modeler: self.mesh = self.modeler.build_mesh(self.char_id, params, rig=self.rig)
        if self.mesh and self.rig:
            self.mesh.parent = self.rig
            self.mesh.modifiers.new(name="Armature", type='ARMATURE').object = self.rig
        if self.mesh and self.shader: self.shader.apply_materials(self.mesh, params)
        if self.rig and self.cfg.get("target_height"):
            manager.normalize_character(self.rig, self.cfg["target_height"])

class MeshCharacter(Character):
    def build(self, manager):
        targets = [t for t in [self.cfg.get("source_mesh"), self.cfg.get("source_rig")] if t]
        objs = manager.link_assets(config.config.assets_blend, targets)
        for obj in objs:
            if obj.type == 'ARMATURE': self.rig = obj; manager.apply_standard_renaming(obj, self.char_id, is_rig=True)
            elif obj.type == 'MESH': self.mesh = obj; manager.apply_standard_renaming(obj, self.char_id, is_rig=False)
        if self.rig and self.cfg.get("target_height"):
            manager.normalize_character(self.rig, self.cfg["target_height"])

class CharacterBuilder:
    @staticmethod
    def create(char_id, cfg):
        ctype = cfg.get("type", "MESH")
        if ctype == "DYNAMIC": return DynamicCharacter(char_id, cfg)
        return MeshCharacter(char_id, cfg)

import bpy
import os
import sys

# Ensure Movie 7 root is in sys.path
M7_ROOT = os.path.dirname(os.path.abspath(__file__))
if M7_ROOT not in sys.path:
    sys.path.insert(0, M7_ROOT)

import config
from registry import registry
# Import procedural components to ensure registration
import modeling.procedural
import rigging.procedural
import shading.universal
import animation.universal

class Character:
    """Strictly OO Character container following Composition over Inheritance."""
    def __init__(self, char_id, cfg):
        self.char_id = char_id
        self.cfg = cfg
        self.rig = None
        self.mesh = None

        c_cfg = cfg.get("components", {})
        self.modeler = self._resolve(registry.get_modeling, c_cfg.get("modeling"))
        self.rigger = self._resolve(registry.get_rigging, c_cfg.get("rigging"))
        self.shader = self._resolve(registry.get_shading, c_cfg.get("shading"))
        self.animator = self._resolve(registry.get_animation, c_cfg.get("animation"))

    def _resolve(self, registry_func, name):
        if not name: return None
        cls = registry_func(name)
        return cls() if cls else None

    def build(self, manager):
        params = self.cfg.get("parameters", {}).copy()
        # Merge structure into params for components
        if "structure" in self.cfg:
            params["structure"] = self.cfg["structure"]

        # 1. Rigging
        if self.rigger:
            self.rig = self.rigger.build_rig(self.char_id, params)

        # 2. Modeling
        if self.modeler:
            self.mesh = self.modeler.build_mesh(self.char_id, params, rig=self.rig)

        # 3. Shading
        if self.mesh and self.shader:
            self.shader.apply_materials(self.mesh, params)

        # 4. Bind Armature Modifier if both exist
        if self.mesh and self.rig:
            mod = self.mesh.modifiers.new(name="Armature", type='ARMATURE')
            mod.object = self.rig

        # 5. Normalization
        if self.rig and self.cfg.get("target_height"):
            manager.normalize_character(self.rig, self.cfg["target_height"])

    def apply_pose(self):
        if self.rig:
            pos = self.cfg.get("default_pos", [0, 0, 0])
            self.rig.location = pos

    def animate(self, tag, frame, params=None):
        if self.rig and self.animator:
            combined_params = self.cfg.get("parameters", {}).copy()
            if params: combined_params.update(params)
            self.animator.apply_action(self.rig, tag, frame, combined_params)

class LinkedCharacter(Character):
    """Character that links assets from a blend file instead of building procedurally."""
    def build(self, manager):
        targets = []
        if self.cfg.get("source_mesh"): targets.append(self.cfg["source_mesh"])
        if self.cfg.get("source_rig"): targets.append(self.cfg["source_rig"])

        blend_file = config.config.protagonist_blend if self.cfg.get("is_protagonist") else config.config.assets_blend
        objs = manager.link_assets(blend_file, targets)
        for obj in objs:
            if obj.type == 'ARMATURE':
                self.rig = obj
                manager.apply_standard_renaming(obj, self.char_id, is_rig=True)
            elif obj.type == 'MESH':
                self.mesh = obj
                manager.apply_standard_renaming(obj, self.char_id, is_rig=False)

        if self.rig and self.cfg.get("target_height"):
            manager.normalize_character(self.rig, self.cfg["target_height"])

class CharacterBuilder:
    """Factory for Character instantiation."""
    @staticmethod
    def create(char_id, cfg):
        ctype = cfg.get("type", "MESH")
        if ctype == "DYNAMIC": return Character(char_id, cfg)
        return LinkedCharacter(char_id, cfg)

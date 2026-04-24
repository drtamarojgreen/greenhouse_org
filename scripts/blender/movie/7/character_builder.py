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
import modeling.plant
import rigging.procedural
import rigging.plant
import shading.universal
import animation.universal

MAIN_CHARACTER_IDS = {"Arbor", "Herbaceous"}
PROTAGONIST_V6_MATERIALS = {
    "Herbaceous": {
        "materials": {
            "primary": {"color": [0.1, 0.15, 0.05]},
            "secondary": {"color": [0.6, 0.4, 0.8]}
        }
    },
    "Arbor": {
        "materials": {
            "primary": {"color": [0.2, 0.12, 0.08]},
            "secondary": {"color": [0.2, 0.6, 0.1]}
        }
    },
}

class Character:
    """Strictly OO Character container following Composition over Inheritance."""
    def __init__(self, char_id, cfg):
        self.char_id = char_id
        self.cfg = cfg
        self.rig = None
        self.mesh = None
        self.is_protagonist = cfg.get("is_protagonist", False) or char_id in MAIN_CHARACTER_IDS

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

        # 6. Main character tagging for director/cinematic logic
        if self.rig:
            self.rig["is_protagonist"] = self.is_protagonist
        if self.mesh:
            self.mesh["is_protagonist"] = self.is_protagonist

    def apply_pose(self):
        pos = self.cfg.get("default_pos", [0, 0, 0])
        if self.rig:
            self.rig.location = pos
        elif self.mesh:
            self.mesh.location = pos

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

        # Protagonist fallback: if linked assets are missing, construct a plant humanoid procedurally
        # so Scene 7 always has both speaking protagonists present.
        if (self.rig is None or self.mesh is None) and self.char_id in MAIN_CHARACTER_IDS:
            fallback_rigger = self._resolve(registry.get_rigging, "PlantRigger")
            fallback_modeler = self._resolve(registry.get_modeling, "PlantModeler")
            fallback_shader = self._resolve(registry.get_shading, "UniversalShader")
            params = self.cfg.get("parameters", {}).copy()
            if "materials" not in params:
                params.update(PROTAGONIST_V6_MATERIALS.get(self.char_id, {}))
            if fallback_rigger and self.rig is None:
                self.rig = fallback_rigger.build_rig(self.char_id, params)
            if fallback_modeler and self.mesh is None:
                self.mesh = fallback_modeler.build_mesh(self.char_id, params, rig=self.rig)
            if fallback_shader and self.mesh:
                fallback_shader.apply_materials(self.mesh, params)

        # Ensure linked mesh follows its rig the same way as procedural characters.
        if self.mesh and self.rig:
            if self.mesh.parent != self.rig:
                self.mesh.parent = self.rig
                self.mesh.matrix_parent_inverse = self.rig.matrix_world.inverted()

            arm_mod = next((m for m in self.mesh.modifiers if m.type == 'ARMATURE'), None)
            if arm_mod is None:
                arm_mod = self.mesh.modifiers.new(name="Armature", type='ARMATURE')
            arm_mod.object = self.rig

        if self.rig:
            self.rig["linked_asset"] = True
        if self.rig and self.cfg.get("target_height"):
            manager.normalize_character(self.rig, self.cfg["target_height"])

        if self.rig:
            self.rig["is_protagonist"] = self.is_protagonist
        if self.mesh:
            self.mesh["is_protagonist"] = self.is_protagonist

class CharacterBuilder:
    """Factory for Character instantiation."""
    @staticmethod
    def create(char_id, cfg):
        resolved_cfg = dict(cfg)
        if char_id in MAIN_CHARACTER_IDS:
            resolved_cfg["is_protagonist"] = True
            resolved_cfg["type"] = "DYNAMIC"
            comps = dict(resolved_cfg.get("components", {}))
            comps.setdefault("modeling", "PlantModeler")
            comps.setdefault("rigging", "PlantRigger")
            comps.setdefault("shading", "UniversalShader")
            comps.setdefault("animation", "ProceduralAnimator")
            resolved_cfg["components"] = comps

        ctype = resolved_cfg.get("type", "MESH")
        if ctype == "DYNAMIC": return Character(char_id, resolved_cfg)
        return LinkedCharacter(char_id, resolved_cfg)

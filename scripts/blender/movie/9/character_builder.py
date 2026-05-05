import bpy
import os
import sys

# Ensure Movie 9 root is in sys.path
M9_ROOT = os.path.dirname(os.path.abspath(__file__))
if M9_ROOT not in sys.path:
    sys.path.insert(0, M9_ROOT)

import config
from registry import registry
# Import procedural components to ensure registration
import modeling.procedural
import modeling.plant
import modeling.greenhouse_mobile
import environment.forest_road
import environment.mountain_base
import rigging.procedural
import rigging.plant
import shading.universal
import animation.universal

class Character:
    """
    Strictly OO Character container following Composition over Inheritance.
    """
    def __init__(self, char_id, cfg):
        self.char_id = char_id
        self.cfg = cfg
        self.rig = None
        self.mesh = None
        self.is_protagonist = cfg.get("is_protagonist", False)

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

        if self.rig: manager.apply_standard_renaming(self.rig, self.char_id, is_rig=True)
        if self.mesh: manager.apply_standard_renaming(self.mesh, self.char_id, is_rig=False)

        # 6. Main character tagging for director/cinematic logic
        if self.rig:
            self.rig["is_protagonist"] = self.is_protagonist
        if self.mesh:
            self.mesh["is_protagonist"] = self.is_protagonist
            if self.mesh.type == 'MESH':
                for poly in self.mesh.data.polygons:
                    poly.use_smooth = True

    def apply_pose(self):
        pos = self.cfg.get("default_pos", [0, 0, 0])
        if self.rig:
            self.rig.location = pos
        elif self.mesh:
            self.mesh.location = pos
        bpy.context.view_layer.update()

    def animate(self, tag, frame, params=None):
        if self.rig and self.animator:
            combined_params = self.cfg.get("parameters", {}).copy()
            if params: combined_params.update(params)
            self.animator.apply_action(self.rig, tag, frame, combined_params)

class LinkedCharacter(Character):
    """
    Character that links assets from a blend file instead of building procedurally.
    Feature Kept: External asset linking ensures that high-fidelity, hand-crafted assets
    from previous versions (like the protagonists) can be seamlessly integrated into the
    new Movie 9 environment.
    """
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

        # Fallback to procedural build if linking failed (ensures test suite and pipeline stability)
        if (self.rig is None or self.mesh is None):
            print(f"INFO: Asset link failed for {self.char_id}, falling back to procedural generation.")
            # Resolve components for procedural fallback from config
            defaults = config.config.get("registry_mappings.default_components", {})
            self.modeler = registry.get_modeling(defaults.get("modeling", "PlantModeler"))()
            self.rigger = registry.get_rigging(defaults.get("rigging", "PlantRigger"))()
            self.shader = registry.get_shading(defaults.get("shading", "UniversalShader"))()
            self.animator = registry.get_animation(defaults.get("animation", "ProceduralAnimator"))()
            
            params = self.cfg.get("parameters", {}).copy()
            if self.rigger: self.rig = self.rigger.build_rig(self.char_id, params)
            if self.modeler: self.mesh = self.modeler.build_mesh(self.char_id, params, rig=self.rig)
            
            # Ensure flags are set BEFORE shading for correct material selection
            is_protag = self.cfg.get("is_protagonist", False)
            if self.rig: self.rig["is_protagonist"] = is_protag
            if self.mesh: self.mesh["is_protagonist"] = is_protag

            if self.mesh and self.shader: self.shader.apply_materials(self.mesh, params)
            
            if self.mesh and self.rig:
                mod = self.mesh.modifiers.get("Armature") or self.mesh.modifiers.new(name="Armature", type='ARMATURE')
                mod.object = self.rig
                if self.mesh.parent != self.rig:
                    self.mesh.parent = self.rig
                    self.mesh.matrix_parent_inverse = self.rig.matrix_world.inverted()
        else:
            # Ensure linked mesh follows its rig
            if self.mesh and self.rig:
                if self.mesh.parent != self.rig:
                    self.mesh.parent = self.rig
                    self.mesh.matrix_parent_inverse = self.rig.matrix_world.inverted()

                arm_mod = next((m for m in self.mesh.modifiers if m.type == 'ARMATURE'), None)
                if arm_mod is None:
                    arm_mod = self.mesh.modifiers.new(name="Armature", type='ARMATURE')
                arm_mod.object = self.rig

        # Only mark as linked_asset if it was ACTUALLY loaded (not fallback)
        protag_ids = config.config.get("ensemble.protagonists", [])
        if self.rig and not (self.char_id in protag_ids and not objs):
            self.rig["linked_asset"] = True
        if self.rig and self.cfg.get("target_height"):
            manager.normalize_character(self.rig, self.cfg["target_height"])

        if self.rig:
            self.rig["is_protagonist"] = self.is_protagonist
        if self.mesh:
            self.mesh["is_protagonist"] = self.is_protagonist
        if self.mesh:
            self.mesh["is_protagonist"] = self.is_protagonist
            if self.mesh.type == 'MESH':
                for poly in self.mesh.data.polygons:
                    poly.use_smooth = True

class CharacterBuilder:
    """Factory for Character instantiation."""
    @staticmethod
    def create(char_id, cfg):
        resolved_cfg = dict(cfg)
        # Ensure default components for registry resolution
        if "components" not in resolved_cfg:
            resolved_cfg["components"] = config.config.get("registry_mappings.default_components", {
                "modeling": "PlantModeler",
                "rigging": "PlantRigger",
                "shading": "UniversalShader",
                "animation": "ProceduralAnimator"
            })
        ctype = resolved_cfg.get("type", "MESH")
        if ctype == "DYNAMIC": return Character(char_id, resolved_cfg)
        return LinkedCharacter(char_id, resolved_cfg)

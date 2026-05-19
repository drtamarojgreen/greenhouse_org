try:
    import movie_configuration as mc
except ImportError:
    from . import movie_configuration as mc
try: import bpy
except ImportError: bpy = None
import os
import json
try:
    from registry import registry
except ImportError:
    from .registry import registry

class CharacterBuilder:
    """
    OO Factory for Character and Entity construction.
    Architecture Kept: The builder pattern ensures that characters are constructed
    with all required components (modeling, rigging, shading, animation) in a
    consistent, decoupled way.
    """

    def __init__(self, char_id, cfg):
        self.char_id = char_id
        self.cfg = cfg
        self.rig = None
        self.body = None

    @staticmethod
    def create(char_id, cfg=None):
        """Factory method to instantiate a CharacterBuilder from mc."""
        if cfg is None:
            cfg = mc.get_character_config(char_id)

        if cfg is None:
            print(f"WARNING: No config found for character {char_id}. Falling back to default.")
            cfg = {"id": char_id, "type": "DYNAMIC"}

        return CharacterBuilder(char_id, cfg)

    def build(self, manager):
        """Orchestrates the multi-phase construction of a character."""
        c_cfg = self.cfg.get("components", {})

        # 1. Rigging
        rig_id = c_cfg.get("rigging")
        rigger_cls = registry.get_rigging(rig_id)
        if rigger_cls:
            self.rig = rigger_cls().build_rig(self.char_id, self.cfg)

        # 2. Modeling
        model_id = c_cfg.get("modeling")
        modeler_cls = registry.get_modeling(model_id)
        if modeler_cls:
            self.body = modeler_cls().build_mesh(self.char_id, self.cfg.get("structure", {}), rig=self.rig)

        # 3. Shading
        shade_id = c_cfg.get("shading")
        if not shade_id and self.cfg.get("is_protagonist"):
             shade_id = "UniversalShader"

        shader_cls = registry.get_shading(shade_id)
        if shader_cls and (self.body or self.rig):
            if self.body:
                self.body["is_protagonist"] = self.cfg.get("is_protagonist", False)
            shader_cls().apply_materials(self.body or self.rig, self.cfg.get("parameters", {}))

        # Handle MESH-type (linked) assets
        if self.cfg.get("type") == "MESH" and not self.rig:
            self._build_linked_asset(manager)

        # 4. Normalization (Scaling & Grounding)
        if self.rig:
            manager.normalize_character(self.rig, self.cfg.get("target_height", 2.0))

        # 5. Initialization (Position/Rotation) - MUST be after normalization
        target = self.rig or self.body
        if target:
            if "default_pos" in self.cfg:
                target.location = self.cfg["default_pos"]
            if "default_rot" in self.cfg:
                target.rotation_euler = self.cfg["default_rot"]

            # Ensure frame 1 state is recorded for clinical transition tests
            if not target.animation_data: target.animation_data_create()
            target.keyframe_insert(data_path="location", frame=1)
            target.keyframe_insert(data_path="rotation_euler", frame=1)

        return self.rig or self.body

    def _build_linked_asset(self, manager):
        blend = mc.assets_blend
        targets = [self.cfg.get("source_mesh"), self.cfg.get("source_rig")]
        objs = manager.link_assets(blend, [t for t in targets if t])

        # Resolve rig and body from linked objects
        for obj in objs:
            if obj.type == 'ARMATURE': self.rig = obj
            elif obj.type == 'MESH': self.body = obj

        if self.rig:
            manager.apply_standard_renaming(self.rig, self.char_id, is_rig=True)
            self.rig["linked_asset"] = True
        if self.body:
            manager.apply_standard_renaming(self.body, self.char_id, is_rig=False)

        if self.rig and self.body:
            self.body.parent = self.rig
            self.body.matrix_parent_inverse.identity()

    def apply_pose(self):
        """Applies the default rest pose based on configuration."""
        if self.rig:
            bpy.context.view_layer.objects.active = self.rig
            bpy.ops.object.mode_set(mode='POSE')
            # Reset bones to 0
            for bone in self.rig.pose.bones:
                bone.rotation_euler = (0,0,0)
                bone.location = (0,0,0)
            bpy.ops.object.mode_set(mode='OBJECT')

    def animate(self, tag, frame, params=None):
        """Applies an animation action to the character."""
        anim_id = self.cfg.get("components", {}).get("animation")
        animator_cls = registry.get_animation(anim_id)
        if animator_cls and self.rig:
            p = self.cfg.get("parameters", {}).copy()
            if params: p.update(params)
            animator_cls().apply_action(self.rig, tag, frame, p)

import bpy
import math
import os
import json
from base import Modeler

class BackdropModeler(Modeler):
    """
    OO Universal Modeler for Chroma Green Backdrops.
    Feature Kept: The chroma backdrop system allows for the integration of
    legacy background assets from Movie 6, facilitating visual continuity
    across the Greenhouse project.
    """

    def build_mesh(self, char_id, params, rig=None):
        coll = bpy.data.collections.get("9b.ENVIRONMENT") or bpy.data.collections.new("9b.ENVIRONMENT")

        cfg = params # chroma block
        size = cfg.get("size", 30)
        alpha = cfg.get("alpha", 0.8)
        bg_images = self._load_v6_background_images(cfg.get("m6_root"))

        for i, wall in enumerate(cfg.get("walls", [])):
            bpy.ops.mesh.primitive_plane_add(size=size, location=wall["pos"])
            obj = bpy.context.active_object
            obj.name = f"chroma_backdrop_{wall['id']}"
            obj.rotation_euler = [math.radians(r) for r in wall["rot"]]

            bg_path = bg_images[i] if i < len(bg_images) else None
            mat = self._create_chroma_mat(obj.name, alpha, bg_path)
            obj.data.materials.append(mat)

            if obj.name not in coll.objects: coll.objects.link(obj)
            for c in list(obj.users_collection):
                if c != coll: c.objects.unlink(obj)

        return None

    def _load_v6_background_images(self, m6_root_override=None):
        """Loads background image paths from Movie 6 config with robust resolution."""
        from config import config
        m9_root = os.path.dirname(os.path.dirname(__file__))
        m6_root = m6_root_override or config.get("paths.m6_root") or os.path.join(m9_root, "..", "6")

        m6_config_json = os.path.join(m6_root, "config.json")
        images = []

        if os.path.exists(m6_config_json):
            try:
                with open(m6_config_json, "r") as f:
                    images = json.load(f).get("background_images", [])
            except Exception as e:
                print(f"Warning: Failed to load M6 config at {m6_config_json}: {e}")

        # Resolve paths
        resolved = []
        for img in images:
            if not img:
                resolved.append(None)
                continue

            # Priority 1: As stored
            if os.path.exists(img):
                resolved.append(img)
                continue

            basename = os.path.basename(img)

            # Priority 2: M6 assets
            m6_assets = os.path.join(m6_root, "assets", basename)
            if os.path.exists(m6_assets):
                resolved.append(m6_assets)
                continue

            # Priority 3: M9 assets
            m9_assets = os.path.join(m9_root, "assets", basename)
            if os.path.exists(m9_assets):
                resolved.append(m9_assets)
                continue

            print(f"Warning: Backdrop image not found: {img}")
            resolved.append(None)

        if not resolved:
            print("Warning: No background images found in Movie 6 config. Falling back to chroma green.")

        return resolved

    def _create_chroma_mat(self, name, alpha, bg_path=None):
        mat = bpy.data.materials.new(name=f"mat_{name}")
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        nodes.clear()

        out = nodes.new(type='ShaderNodeOutputMaterial')
        emit = nodes.new(type='ShaderNodeEmission')
        emit.inputs['Color'].default_value = (0, 1, 0, 1)
        emit.inputs['Strength'].default_value = 5.0

        transp = nodes.new(type='ShaderNodeBsdfTransparent')
        mix = nodes.new(type='ShaderNodeMixShader')
        mix.inputs[0].default_value = 1.0 - alpha

        if bg_path and os.path.exists(bg_path):
            tex_img = nodes.new(type='ShaderNodeTexImage')
            tex_coord = nodes.new(type='ShaderNodeTexCoord')
            try:
                tex_img.image = bpy.data.images.load(filepath=bg_path)
                mat.node_tree.links.new(tex_coord.outputs['Window'], tex_img.inputs['Vector'])
                mat.node_tree.links.new(tex_img.outputs['Color'], emit.inputs['Color'])
            except Exception:
                emit.inputs['Color'].default_value = (0, 1, 0, 1)

        mat.node_tree.links.new(transp.outputs[0], mix.inputs[1])
        mat.node_tree.links.new(emit.outputs[0], mix.inputs[2])
        mat.node_tree.links.new(mix.outputs[0], out.inputs[0])

        mat.blend_method = 'BLEND'
        return mat

from registry import registry
registry.register_modeling("BackdropModeler", BackdropModeler)

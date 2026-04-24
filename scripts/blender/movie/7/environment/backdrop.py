import bpy
import math
import os
import json
from base import Modeler

class BackdropModeler(Modeler):
    """OO Universal Modeler for Chroma Green Backdrops."""

    def build_mesh(self, char_id, params, rig=None):
        coll = bpy.data.collections.get("7b.ENVIRONMENT") or bpy.data.collections.new("7b.ENVIRONMENT")

        cfg = params # chroma block
        size = cfg.get("size", 30)
        alpha = cfg.get("alpha", 0.8)
        bg_images = self._load_v6_background_images()

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

    def _load_v6_background_images(self):
        m6_config_json = os.path.join(os.path.dirname(os.path.dirname(__file__)), "6", "config.json")
        try:
            if os.path.exists(m6_config_json):
                with open(m6_config_json, "r") as f:
                    return json.load(f).get("background_images", [])
        except Exception:
            pass
        return []

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

import bpy
from base import Shader
from registry import registry
import os
import sys

# Ensure shading dir is in path for utils
SHADING_DIR = os.path.dirname(os.path.abspath(__file__))
if SHADING_DIR not in sys.path:
    sys.path.insert(0, SHADING_DIR)
import shading_utils

class UniversalShader(Shader):
    """Truly Universal Shader that builds materials from config data."""

    def apply_materials(self, mesh, params):
        # 1. Resolve and create all materials defined in config
        mats_cfg = params.get("materials", {})
        materials = {}
        char_id = mesh.name.split(".")[0]
        for mat_id, cfg in mats_cfg.items():
            mat_name = f"{mesh.name}_{mat_id}"
            if char_id in {"Herbaceous", "Arbor"}:
                if mat_id == "primary":
                    mat_name = f"Bark_{char_id}_primary"
                elif mat_id == "secondary":
                    mat_name = f"Leaf_{char_id}_secondary"
            materials[mat_id] = self._create_material(mat_name, cfg)

        # 2. Assign only materials required by current mesh material indices.
        max_slot = 0
        if hasattr(mesh.data, "polygons") and len(mesh.data.polygons) > 0:
            max_slot = max(p.material_index for p in mesh.data.polygons)

        ordered = ["primary"]
        if max_slot >= 1: ordered.append("secondary")
        if max_slot >= 2: ordered.append("accent")

        for mat_id in ordered:
            mat = materials.get(mat_id)
            if mat and mat.name not in [m.name for m in mesh.data.materials if m]:
                mesh.data.materials.append(mat)

        # 3. Assign materials to props based on metadata
        if mesh.parent and mesh.parent.type == 'ARMATURE':
            for child in mesh.parent.children:
                if child == mesh: continue
                mat_id = child.get("material_id", "primary")
                mat = materials.get(mat_id)
                if mat:
                    child.data.materials.append(mat)

    def _create_material(self, name, cfg):
        color = cfg.get("color", (1,1,1))
        emission = cfg.get("emission", 0.0)

        mat = bpy.data.materials.get(name) or bpy.data.materials.new(name=name)
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        bsdf = nodes.get("Principled BSDF") or nodes.new(type='ShaderNodeBsdfPrincipled')

        if "Iris" in name or "Eye" in name:
            shading_utils.setup_iris_nodes(mat, color)
        else:
            bsdf.inputs['Base Color'].default_value = (*color[:3], 1.0)
            if 'Emission' in bsdf.inputs:
                 bsdf.inputs['Emission'].default_value = (*color[:3], 1.0)
                 # Handle Blender 4.0+ Emission Strength
                 strength_input = bsdf.inputs.get('Emission Strength') or bsdf.inputs.get('Emission')
                 if strength_input and hasattr(strength_input, "default_value"):
                     strength_input.default_value = emission
            
            if "Leaf" in name:
                shading_utils.setup_sss(bsdf)

        return mat

registry.register_shading("UniversalShader", UniversalShader)
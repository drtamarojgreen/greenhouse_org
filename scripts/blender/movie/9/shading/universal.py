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
    """Universal material applier that maps parameters to NodeGroups."""

    def apply_materials(self, mesh, params):
        mats_cfg = params.get("materials", {})
        materials = {}
        is_protag = mesh.get("is_protagonist", False)

        if not mats_cfg:
            if is_protag:
                # Inject full semantic set for protagonists
                mats_cfg = {
                    "primary":   {"color": [0.15, 0.1, 0.05]}, # Bark
                    "secondary": {"color": [0.2, 0.6, 0.1]},    # Leaf
                    "iris":      {"color": [0.4, 0.2, 0.6]},
                    "pupil":     {"color": [0.0, 0.0, 0.0]}
                }
            else:
                # Basic fallback for generic entities
                mats_cfg = { "primary": {"color": [0.5, 0.5, 0.5]} }

        for mat_id, cfg in mats_cfg.items():
            mat_name = f"{mesh.name}_{mat_id}"
            if is_protag:
                prefix = "Bark" if mat_id == "primary" else ("Iris" if mat_id == "iris" else ("Pupil" if mat_id == "pupil" else "Leaf"))
                mat_name = f"{prefix}_{mesh.name}_{mat_id}"
            materials[mat_id] = self._create_material(mat_name, cfg)

        # 2. Assign materials from config with strict semantic ordering
        # Mapping: primary -> 0, secondary -> 1, iris -> 2, pupil -> 3, accent -> 4+
        semantic_order = ["primary", "secondary", "iris", "pupil"]
        ordered = [k for k in semantic_order if k in materials]
        # Add any others (accent, etc.)
        for k in materials:
            if k not in ordered: ordered.append(k)
        
        for mat_id in ordered:
            mat = materials.get(mat_id)
            if mat and mat.name not in [m.name for m in mesh.data.materials if m]:
                mesh.data.materials.append(mat)

        # 3. Assign materials to props
        if mesh.parent and mesh.parent.type == 'ARMATURE':
            for child in mesh.parent.children:
                if child == mesh: continue
                mat_id = child.get("material_id", "primary")
                mat = materials.get(mat_id)
                if mat: child.data.materials.append(mat)

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
                 strength_input = bsdf.inputs.get('Emission Strength') or bsdf.inputs.get('Emission')
                 if strength_input and hasattr(strength_input, "default_value"):
                     strength_input.default_value = emission
            
            if "Leaf" in name:
                shading_utils.setup_sss(bsdf)

        return mat

registry.register_shading("UniversalShader", UniversalShader)

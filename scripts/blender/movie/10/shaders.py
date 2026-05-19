import bpy
from .base import Shader
from .registry import registry

class UniversalShader(Shader):
    """Universal material applier for Movie 10."""

    def apply_materials(self, mesh, params):
        mats_cfg = params.get("materials", {})
        materials = {}
        is_protag = mesh.get("is_protagonist", False)

        if not mats_cfg:
            if is_protag:
                mats_cfg = {
                    "primary":   {"color": [0.15, 0.1, 0.05]},
                    "secondary": {"color": [0.2, 0.6, 0.1]},
                    "iris":      {"color": [0.4, 0.2, 0.6]},
                    "pupil":     {"color": [0.0, 0.0, 0.0]}
                }
            else:
                mats_cfg = { "primary": {"color": [0.5, 0.5, 0.5]} }

        for mat_id, cfg in mats_cfg.items():
            mat_name = f"{mesh.name}_{mat_id}"
            materials[mat_id] = self._create_material(mat_name, cfg)

        semantic_order = ["primary", "secondary", "iris", "pupil"]
        ordered = [k for k in semantic_order if k in materials]
        for k in materials:
            if k not in ordered: ordered.append(k)

        for mat_id in ordered:
            mat = materials.get(mat_id)
            if mat and mat.name not in [m.name for m in mesh.data.materials if m]:
                mesh.data.materials.append(mat)

    def _create_material(self, name, cfg):
        color = cfg.get("color", (1,1,1))
        emission = cfg.get("emission", 0.0)

        mat = bpy.data.materials.get(name) or bpy.data.materials.new(name=name)
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        bsdf = nodes.get("Principled BSDF") or nodes.new(type='ShaderNodeBsdfPrincipled')

        bsdf.inputs['Base Color'].default_value = (*color[:3], 1.0)
        if 'Emission' in bsdf.inputs:
             bsdf.inputs['Emission'].default_value = (*color[:3], 1.0)
             strength_input = bsdf.inputs.get('Emission Strength') or bsdf.inputs.get('Emission')
             if strength_input and hasattr(strength_input, "default_value"):
                 strength_input.default_value = emission

        return mat

registry.register_shading("UniversalShader", UniversalShader)

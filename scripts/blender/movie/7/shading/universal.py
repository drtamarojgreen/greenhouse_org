import bpy
from base import Shader
from registry import registry

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
                    mat_name = f"Bark_{char_id}"
                elif mat_id == "secondary":
                    mat_name = f"Leaf_{char_id}"
            materials[mat_id] = self._create_material(mat_name, cfg)

        # 2. Assign body materials in index order (supports foliage faces set to material_index=1)
        for mat_id in ["primary", "secondary", "accent"]:
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

        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        bsdf = nodes.get("Principled BSDF") or nodes.new(type='ShaderNodeBsdfPrincipled')

        bsdf.inputs['Base Color'].default_value = (*color[:3], 1.0)
        if 'Emission' in bsdf.inputs: # For newer Blender versions
             bsdf.inputs['Emission'].default_value = (*color[:3], 1.0)
             bsdf.inputs['Emission Strength'].default_value = emission

        return mat

registry.register_shading("UniversalShader", UniversalShader)

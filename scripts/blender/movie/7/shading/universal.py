import bpy
from base import Shader
from registry import registry

class UniversalShader(Shader):
    """Truly Universal Shader that builds materials from config data."""

    def apply_materials(self, mesh, params):
        # 1. Resolve and create all materials defined in config
        mats_cfg = params.get("materials", {})
        materials = {}
        for mat_id, cfg in mats_cfg.items():
            materials[mat_id] = self._create_material(f"{mesh.name}_{mat_id}", cfg.get("color", (1,1,1)))

        # 2. Assign primary material to the main body
        # We assume the first material in config or 'primary' is the body material
        primary_mat = materials.get("primary")
        if primary_mat:
            mesh.data.materials.append(primary_mat)

        # 3. Assign materials to props based on metadata
        if mesh.parent and mesh.parent.type == 'ARMATURE':
            for child in mesh.parent.children:
                if child == mesh: continue
                mat_id = child.get("material_id", "primary")
                mat = materials.get(mat_id)
                if mat:
                    child.data.materials.append(mat)

    def _create_material(self, name, color):
        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        bsdf = nodes.get("Principled BSDF") or nodes.new(type='ShaderNodeBsdfPrincipled')
        bsdf.inputs['Base Color'].default_value = (*color, 1)
        return mat

registry.register_shading("UniversalShader", UniversalShader)

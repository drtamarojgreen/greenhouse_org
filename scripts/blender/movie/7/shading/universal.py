import bpy
from base import Shader
from registry import registry

class UniversalShader(Shader):
    """Universal Shader that applies materials based on character parameters."""

    def apply_materials(self, mesh, params):
        mats = params.get("materials", {})

        # We define standard material slots based on common needs
        bark_color = mats.get("bark_color", (0.2, 0.12, 0.08))
        leaf_color = mats.get("leaf_color", (0.2, 0.6, 0.1))
        iris_color = mats.get("iris_color", (0.36, 0.24, 0.62))

        bark_mat = self._create_material(f"Bark_{mesh.name}", bark_color)
        leaf_mat = self._create_material(f"Leaf_{mesh.name}", leaf_color)
        iris_mat = self._create_material(f"Iris_{mesh.name}", iris_color)

        mesh.data.materials.append(bark_mat)
        mesh.data.materials.append(leaf_mat)

        # Generic part-to-material mapping logic
        if mesh.parent and mesh.parent.type == 'ARMATURE':
            for child in mesh.parent.children:
                if child == mesh: continue
                if "Eye" in child.name:
                    child.data.materials.append(iris_mat)
                else:
                    child.data.materials.append(bark_mat)

    def _create_material(self, name, color):
        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        bsdf = nodes.get("Principled BSDF") or nodes.new(type='ShaderNodeBsdfPrincipled')
        bsdf.inputs['Base Color'].default_value = (*color, 1)
        return mat

registry.register_shading("UniversalShader", UniversalShader)

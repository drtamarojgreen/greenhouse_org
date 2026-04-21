import bpy
from ..base import Shader
from ..registry import registry

class PlantShader(Shader):
    """Production shaders ported from Movie 6."""
    def apply_materials(self, mesh, params):
        mats = params.get("materials", {})
        bark_color = mats.get("bark_color", (0.2, 0.12, 0.08))
        leaf_color = mats.get("leaf_color", (0.2, 0.6, 0.1))

        bark_mat = self._create_mat(f"Bark_{mesh.name}", bark_color)
        leaf_mat = self._create_mat(f"Leaf_{mesh.name}", leaf_color)

        mesh.data.materials.append(bark_mat)
        mesh.data.materials.append(leaf_mat)

    def _create_mat(self, name, color):
        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        bsdf.inputs['Base Color'].default_value = (*color, 1)
        return mat

registry.register_shading("PlantShader", PlantShader)

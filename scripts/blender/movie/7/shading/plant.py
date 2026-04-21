import bpy
try:
    from shading.base import Shader
    from registry import registry
except ImportError:
    from .base import Shader
    from ..registry import registry

class PlantShader(Shader):
    def apply_materials(self, mesh, params):
        mats = params.get("materials", {})
        bark_color = mats.get("bark_color", (0.2, 0.12, 0.08))
        leaf_color = mats.get("leaf_color", (0.2, 0.6, 0.1))

        bark_mat = self._create_bark_mat(f"Bark_{mesh.name}", bark_color)
        leaf_mat = self._create_leaf_mat(f"Leaf_{mesh.name}", leaf_color)
        iris_mat = self._create_iris_mat(f"Iris_{mesh.name}")

        mesh.data.materials.append(bark_mat)
        mesh.data.materials.append(leaf_mat)

        for child in mesh.parent.children:
            if "Eye" in child.name: child.data.materials.append(iris_mat)
            elif "Lid" in child.name or "Nose" in child.name: child.data.materials.append(bark_mat)

    def _create_bark_mat(self, name, color):
        mat = bpy.data.materials.new(name=name); mat.use_nodes = True
        bsdf = mat.node_tree.nodes["Principled BSDF"]; bsdf.inputs['Base Color'].default_value = (*color, 1)
        bsdf.inputs['Roughness'].default_value = 0.98; return mat

    def _create_leaf_mat(self, name, color):
        mat = bpy.data.materials.new(name=name); mat.use_nodes = True
        bsdf = mat.node_tree.nodes["Principled BSDF"]; bsdf.inputs['Base Color'].default_value = (*color, 1)
        bsdf.inputs['Roughness'].default_value = 0.4; return mat

    def _create_iris_mat(self, name):
        mat = bpy.data.materials.new(name=name); mat.use_nodes = True
        bsdf = mat.node_tree.nodes["Principled BSDF"]; bsdf.inputs['Base Color'].default_value = (0.36, 0.24, 0.62, 1)
        bsdf.inputs['Roughness'].default_value = 0.08; return mat

registry.register_shading("PlantShader", PlantShader)

import bpy
import base
import registry

class PlantShader(base.Shader):
    def apply_materials(self, mesh, params):
        mats = params.get("materials", {})
        bc, lc = mats.get("bark_color", (0.2, 0.12, 0.08)), mats.get("leaf_color", (0.2, 0.6, 0.1))
        bm, lm, im = self._cm(f"Bark_{mesh.name}", bc), self._cm(f"Leaf_{mesh.name}", lc), self._cm(f"Iris_{mesh.name}", (0.36, 0.24, 0.62))
        mesh.data.materials.append(bm); mesh.data.materials.append(lm)
        for c in mesh.parent.children:
            if "Eye" in c.name: c.data.materials.append(im)
            elif any(s in c.name for s in ["Lid", "Nose", "Chin", "Ear"]): c.data.materials.append(bm)

    def _cm(self, name, color):
        mat = bpy.data.materials.new(name=name); mat.use_nodes = True
        bsdf = mat.node_tree.nodes["Principled BSDF"]; bsdf.inputs['Base Color'].default_value = (*color, 1); return mat

registry.registry.register_shading("PlantShader", PlantShader)

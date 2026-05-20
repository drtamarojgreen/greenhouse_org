try:
    import bpy
    import bmesh
    import mathutils
except ImportError:
    bpy = None
    bmesh = None
    mathutils = None

try:
    from .base import Shader
    from .registry import registry
except (ImportError, ValueError):
    try:
        from base import Shader
        from registry import registry
    except ImportError:
        Shader = object
        registry = None

class UniversalShader(Shader):
    """
    High-Fidelity Shader for Movie 10.
    Implements PBR-lite and anatomical subsurface scattering stubs.
    """

    def apply_materials(self, mesh_obj, params):
        if not bpy: return
        # Setup slots
        mats = params.get("materials", {})

        primary_col = mats.get("primary", {}).get("color", [0.12, 0.08, 0.04, 1])
        secondary_col = mats.get("secondary", {}).get("color", [0.1, 0.6, 0.15, 1])
        iris_col = mats.get("iris", {}).get("color", [0.2, 0.4, 1.0, 1])

        # Create materials
        m1 = self._create_hf_material("Bark_HF", primary_col)
        m2 = self._create_hf_material("Leaf_HF", secondary_col)
        m3 = self._create_hf_material("Iris_HF", iris_col)
        m4 = self._create_hf_material("Pupil_HF", [0.01, 0.01, 0.01, 1])

        mesh_obj.data.materials.append(m1)
        mesh_obj.data.materials.append(m2)
        mesh_obj.data.materials.append(m3)
        mesh_obj.data.materials.append(m4)

    def _create_hf_material(self, name, color):
        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        bsdf = nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs['Base Color'].default_value = color if len(color) == 4 else (color[0], color[1], color[2], 1)
            bsdf.inputs['Roughness'].default_value = 0.8
        return mat

if registry:
    registry.register_shading("UniversalShader", UniversalShader)

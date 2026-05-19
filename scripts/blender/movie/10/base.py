try: import bpy
except ImportError: bpy = None

class Modeler:
    def build_mesh(self, char_id, params, rig=None):
        pass

class Rigger:
    def build_rig(self, char_id, params):
        pass

class Shader:
    def apply_materials(self, mesh_obj, params):
        pass

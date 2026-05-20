try:
    import bpy
    import bmesh
    import mathutils
except ImportError:
    bpy = None
    bmesh = None
    mathutils = None

class Registry:
    def __init__(self):
        self.modelers = {}
        self.riggers = {}
        self.shading = {}
        self.animations = {}
    def register_modeling(self, name, cls): self.modelers[name] = cls
    def register_rigging(self, name, cls): self.riggers[name] = cls
    def register_shading(self, name, cls): self.shading[name] = cls
    def register_animation(self, name, cls): self.animations[name] = cls
    def get_modeling(self, name): return self.modelers.get(name)
    def get_rigging(self, name): return self.riggers.get(name)
    def get_shading(self, name): return self.shading.get(name)
    def get_animation(self, name): return self.animations.get(name)

registry = Registry()

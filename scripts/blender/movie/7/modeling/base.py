import bpy
import bmesh
import mathutils

class GeometryComponent:
    def add_to_bmesh(self, bm, dlayer, mesh_obj): raise NotImplementedError()

class MeshStructure:
    def __init__(self, char_id):
        self.char_id, self.components = char_id, []
    def add_component(self, comp): self.components.append(comp)
    def build(self):
        mesh_data = bpy.data.meshes.new(f"{self.char_id}_MeshData")
        mesh_obj = bpy.data.objects.new(f"{self.char_id}.Body", mesh_data)
        bpy.context.scene.collection.objects.link(mesh_obj)
        bm = bmesh.new(); dlayer = bm.verts.layers.deform.verify()
        for comp in self.components: comp.add_to_bmesh(bm, dlayer, mesh_obj)
        bm.to_mesh(mesh_data); bm.free(); return mesh_obj

class Modeler:
    def build_mesh(self, char_id, params): raise NotImplementedError()

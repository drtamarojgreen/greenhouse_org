import bpy
import math

class BoneDefinition:
    def __init__(self, name, head, tail, parent=None, use_deform=True):
        self.name, self.head, self.tail, self.parent, self.use_deform = name, head, tail, parent, use_deform

class RigStructure:
    def __init__(self, char_id):
        self.char_id, self.bones = char_id, []

    def add_bone(self, name, head, tail, parent=None, use_deform=True):
        self.bones.append(BoneDefinition(name, head, tail, parent, use_deform))

    def build(self):
        arm_data = bpy.data.armatures.new(f"{self.char_id}_ArmData")
        rig = bpy.data.objects.new(f"{self.char_id}.Rig", arm_data)
        bpy.context.scene.collection.objects.link(rig)
        bpy.context.view_layer.objects.active = rig
        bpy.ops.object.mode_set(mode='EDIT')
        for b in self.bones:
            eb = arm_data.edit_bones.new(b.name)
            eb.head, eb.tail = b.head, b.tail
            if b.parent: eb.parent = arm_data.edit_bones[b.parent]
            eb.use_deform = b.use_deform
        bpy.ops.object.mode_set(mode='OBJECT')
        return rig

class Rigger:
    def build_rig(self, char_id, params): raise NotImplementedError()

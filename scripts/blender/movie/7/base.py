class Modeler:
    def validate_params(self, params):
        """Optional validation of modeling parameters."""
        pass
    def build_mesh(self, char_id, params, rig=None): raise NotImplementedError()

class Rigger:
    def validate_params(self, params):
        """Optional validation of rigging parameters."""
        pass
    def build_rig(self, char_id, params): raise NotImplementedError()

class Shader:
    def validate_params(self, params):
        """Optional validation of shading parameters."""
        pass
    def apply_materials(self, mesh, params): raise NotImplementedError()

class Animator:
    def validate_params(self, params):
        """Optional validation of animation parameters."""
        pass
    def apply_action(self, rig, tag, frame, params): raise NotImplementedError()

class Action:
    def apply(self, rig, frame, duration, params): raise NotImplementedError()

class ProceduralAction(Action):
    def _animate(self, rig, bone_name, path, index, func, freq, amp, start, duration):
        bone = rig.pose.bones.get(bone_name)
        if not bone: return
        for f in range(start, start + duration):
            val = func(f * freq) * amp
            if path == "rotation_euler": bone.rotation_euler[index] = val
            elif path == "location": bone.location[index] = val
            bone.keyframe_insert(data_path=path, index=index, frame=f)

class BoneDefinition:
    def __init__(self, name, head, tail, parent=None, use_deform=True):
        self.name, self.head, self.tail, self.parent, self.use_deform = name, head, tail, parent, use_deform

class RigStructure:
    def __init__(self, char_id): self.char_id, self.bones = char_id, []
    def add_bone(self, name, head, tail, parent=None, use_deform=True):
        self.bones.append(BoneDefinition(name, head, tail, parent, use_deform))
    def build(self):
        import bpy
        ad = bpy.data.armatures.new(f"{self.char_id}_ArmData")
        rig = bpy.data.objects.new(f"{self.char_id}.Rig", ad)
        bpy.context.scene.collection.objects.link(rig)
        bpy.context.view_layer.objects.active = rig
        bpy.ops.object.mode_set(mode='EDIT')
        for b in self.bones:
            eb = ad.edit_bones.new(b.name)
            eb.head, eb.tail = b.head, b.tail
            if b.parent: eb.parent = ad.edit_bones[b.parent]
            eb.use_deform = b.use_deform
        bpy.ops.object.mode_set(mode='OBJECT'); return rig

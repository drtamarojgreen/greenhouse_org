try:
    import bpy
    import bmesh
    import mathutils
except ImportError:
    bpy = None
    bmesh = None
    mathutils = None

    import bpy
    import bmesh
    import mathutils
except ImportError:
    bpy = None
    bmesh = None
    mathutils = None
    import bpy
    import bmesh
    import mathutils
except ImportError:
    bpy = None
    bmesh = None
    mathutils = None
    import bpy
    import bmesh
    import mathutils
except ImportError:
    bpy = None
    bmesh = None
    mathutils = None
import math
import os

    from .base import Rigger
    from .registry import registry
except (ImportError, ValueError):
        from base import Rigger
        from registry import registry
    except ImportError:
        Rigger = object
        registry = None

class PlantRigger(Rigger):
    """
    Advanced Rigging for Movie 10 Plant Protagonists.
    Supports complex limb articulation and high-fidelity facial bones.
    """

    def build_rig(self, char_id, params):
        if not bpy: return None
        rig_data = bpy.data.armatures.new(f"{char_id}_RigData")
        rig_obj = bpy.data.objects.new(f"{char_id}.Rig", rig_data)
        bpy.context.scene.collection.objects.link(rig_obj)

        bpy.context.view_layer.objects.active = rig_obj
        bpy.ops.object.mode_set(mode='EDIT')

        # Torso chain
        root = rig_data.edit_bones.new("Root")
        root.head = (0,0,0); root.tail = (0,0,0.1)

        spine = rig_data.edit_bones.new("Torso")
        spine.parent = root
        spine.head = (0,0,0.1); spine.tail = (0,0,1.5)

        neck = rig_data.edit_bones.new("Neck")
        neck.parent = spine
        neck.head = (0,0,1.5); neck.tail = (0,0,1.7)

        head = rig_data.edit_bones.new("Head")
        head.parent = neck
        head.head = (0,0,1.7); head.tail = (0,0,2.1)

        # Facial Bones
        for side, sx in [("L", 1), ("R", -1)]:
            eye = rig_data.edit_bones.new(f"Eye.{side}")
            eye.parent = head
            eye.head = (0.15*sx, -0.4, 1.8); eye.tail = (0.15*sx, -0.5, 1.8)

        # Limbs
        for side, sx in [("L", 1), ("R", -1)]:
            # Arm
            ua = rig_data.edit_bones.new(f"Arm.{side}")
            ua.parent = spine
            ua.head = (0.4*sx, 0, 1.35); ua.tail = (0.4*sx, 0, 0.95)

            la = rig_data.edit_bones.new(f"Elbow.{side}")
            la.parent = ua
            la.head = (0.4*sx, 0, 0.95); la.tail = (0.4*sx, 0, 0.55)

            h = rig_data.edit_bones.new(f"Hand.{side}")
            h.parent = la
            h.head = (0.4*sx, 0, 0.55); h.tail = (0.4*sx, 0, 0.4)

            # Leg
            ul = rig_data.edit_bones.new(f"Thigh.{side}")
            ul.parent = root
            ul.head = (0.25*sx, 0, 0.15); ul.tail = (0.25*sx, 0, -0.35)

            ll = rig_data.edit_bones.new(f"Knee.{side}")
            ll.parent = ul
            ll.head = (0.25*sx, 0, -0.35); ll.tail = (0.25*sx, 0, -0.85)

            f = rig_data.edit_bones.new(f"Foot.{side}")
            f.parent = ll
            f.head = (0.25*sx, 0, -0.85); f.tail = (0.25*sx, -0.25, -0.85)

        bpy.ops.object.mode_set(mode='OBJECT')
        return rig_obj

if registry:
    registry.register_rigging("PlantRigger", PlantRigger)

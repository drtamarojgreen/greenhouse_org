import bpy
import os
import sys

# prioritize movie/6
V6_DIR = os.path.dirname(os.path.abspath(__file__))
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)
ASSETS_V6_DIR = os.path.join(V6_DIR, "assets_v6")
if ASSETS_V6_DIR not in sys.path: sys.path.insert(0, ASSETS_V6_DIR)

import config
from plant_humanoid_v6 import create_plant_humanoid_v6

class SylvanEnsembleManager:
    def __init__(self):
        self.collection_name = "6a.ASSETS"
        self.ensemble = config.SPIRIT_ENSEMBLE
        self.rig_map = config.RIG_MAP_SRC

    def ensure_clean_slate(self):
        for obj in list(bpy.data.objects): bpy.data.objects.remove(obj, do_unlink=True)
        for block in (bpy.data.meshes, bpy.data.armatures, bpy.data.materials, bpy.data.cameras, bpy.data.lights, bpy.data.images, bpy.data.actions, bpy.data.worlds):
            for item in list(block): block.remove(item, do_unlink=True)
        bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)

    def link_ensemble(self):
        coll = bpy.data.collections.get(self.collection_name) or bpy.data.collections.new(self.collection_name)
        if coll.name not in bpy.context.scene.collection.children: bpy.context.scene.collection.children.link(coll)
        want = set(list(self.ensemble.keys()) + list(self.rig_map.values()))
        if os.path.exists(config.SPIRITS_ASSET_BLEND):
            with bpy.data.libraries.load(config.SPIRITS_ASSET_BLEND, link=False) as (data_from, data_to):
                data_to.objects = [n for n in data_from.objects if n in want]
            for obj in data_to.objects:
                if obj and obj.name not in coll.objects:
                    coll.objects.link(obj)
                    obj["source_name"] = obj.name

    def renormalize_objects(self):
        import mathutils
        coll = bpy.data.collections.get(self.collection_name)
        if not coll: return
        targets = [(src, art) for src, art in self.ensemble.items()]
        for src_mesh_name, art_name in targets:
            t_mesh_name, t_rig_name = f"{art_name}.Body", f"{art_name}.Rig"
            rig = bpy.data.objects.get(t_rig_name) or next((o for o in coll.objects if o.get("source_name") == self.rig_map.get(art_name)), None)
            mesh = bpy.data.objects.get(t_mesh_name) or next((o for o in coll.objects if o.get("source_name") == src_mesh_name), None)
            if not mesh: continue
            mesh.name = t_mesh_name
            if rig:
                rig.name = t_rig_name
                mesh.parent = rig
                mesh.matrix_parent_inverse = mathutils.Matrix.Identity(4)
                arm_mod = next((m for m in mesh.modifiers if m.type == 'ARMATURE'), None) or mesh.modifiers.new(name="Armature", type='ARMATURE')
                arm_mod.object = rig

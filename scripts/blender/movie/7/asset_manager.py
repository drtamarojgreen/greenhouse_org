import bpy
import mathutils
import os
from .config import config

class AssetManager:
    """Abstract Asset Manager for modular movie production."""

    def __init__(self):
        self.coll_assets = config.coll_assets

    def ensure_collection(self, name):
        coll = bpy.data.collections.get(name) or bpy.data.collections.new(name)
        if coll.name not in bpy.context.scene.collection.children:
            bpy.context.scene.collection.children.link(coll)
        return coll

    def clear_scene(self):
        """Purges data-blocks for a clean slate."""
        for obj in list(bpy.data.objects):
            bpy.data.objects.remove(obj, do_unlink=True)
        for block in (bpy.data.meshes, bpy.data.armatures, bpy.data.materials,
                      bpy.data.cameras, bpy.data.lights, bpy.data.images,
                      bpy.data.actions, bpy.data.worlds):
            for item in list(block):
                block.remove(item, do_unlink=True)
        bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)

    def link_assets(self, blend_path, targets):
        """Links specified objects from a blend file."""
        if not os.path.exists(blend_path):
            print(f"ERROR: Asset blend not found: {blend_path}")
            return []

        coll = self.ensure_collection(self.coll_assets)

        with bpy.data.libraries.load(blend_path, link=False) as (data_from, data_to):
            data_to.objects = [n for n in targets if n in data_from.objects]

        imported_objs = []
        for obj in data_to.objects:
            if obj:
                coll.objects.link(obj)
                imported_objs.append(obj)
                for child in obj.children_recursive:
                    if child.name not in coll.objects:
                        coll.objects.link(child)
        return imported_objs

    def normalize_scale(self, rig, target_height):
        """Data-driven scaling based on configuration."""
        if not rig: return
        bpy.context.view_layer.update()

        metrics = self._get_metrics(rig)
        if not metrics or metrics['height'] < 0.001: return

        scale_factor = target_height / metrics['height']
        rig.scale *= scale_factor

        bpy.context.view_layer.objects.active = rig
        rig.select_set(True)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

        bpy.context.view_layer.update()
        new_metrics = self._get_metrics(rig)
        if new_metrics:
            rig.location.z -= new_metrics['ground_z']
        bpy.context.view_layer.update()

    def _get_metrics(self, rig):
        """Calculates height and ground Z."""
        meshes = [c for c in rig.children_recursive if c.type == 'MESH']
        if not meshes: return None

        all_z = []
        for m in meshes:
            mw = m.matrix_world
            for v in m.data.vertices:
                all_z.append((mw @ v.co).z)

        if not all_z: return None

        min_z, max_z = min(all_z), max(all_z)
        # Simplified density/percentile logic for abstraction
        return {"height": max_z - min_z, "ground_z": min_z}

    def apply_standard_renaming(self, obj, new_id, is_rig=False):
        suffix = "Rig" if is_rig else "Body"
        obj.name = f"{new_id}.{suffix}"

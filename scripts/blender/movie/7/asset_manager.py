import bpy
import bmesh
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
            try:
                bpy.data.objects.remove(obj, do_unlink=True)
            except: pass
        for block in (bpy.data.meshes, bpy.data.armatures, bpy.data.materials,
                      bpy.data.cameras, bpy.data.lights, bpy.data.images,
                      bpy.data.actions, bpy.data.worlds):
            for item in list(block):
                try:
                    block.remove(item, do_unlink=True)
                except: pass
        bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)

    def link_assets(self, blend_path, targets):
        """Links (appends) specified objects from a blend file."""
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

    def normalize_character(self, rig, target_height):
        """Comprehensive normalization: Origin Reset, Scaling, and Culling."""
        if not rig or rig.type != 'ARMATURE': return

        # 1. Origin Reset
        if config.get("normalization.enable_origin_reset", True):
            self.execute_origin_reset(rig)

        # 2. Scaling
        self.normalize_scale(rig, target_height)

        # 3. Statistical Culling
        if config.get("normalization.enable_culling", True):
            self.execute_balanced_culling(rig)

    def execute_origin_reset(self, rig):
        """Snaps rig and parented meshes to True Ground."""
        meshes = [c for c in rig.children_recursive if c.type == 'MESH']
        rig.location = (0, 0, 0)
        rig.rotation_euler = (0, 0, 0)
        rig.scale = (1, 1, 1)

        for m in meshes:
            m.parent = rig
            m.matrix_parent_inverse = mathutils.Matrix.Identity(4)
            m.location = (0, 0, 0)
            m.rotation_euler = (0, 0, 0)
            m.scale = (1, 1, 1)

        bpy.context.view_layer.update()
        metrics = self._get_metrics(rig)
        if metrics:
            rig.location.z -= metrics['ground_z']
        bpy.context.view_layer.update()

    def normalize_scale(self, rig, target_height):
        """Scales the rig so the character reaches the target height."""
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

    def execute_balanced_culling(self, rig):
        """Removes spidery vertex outliers."""
        meshes = [c for c in rig.children_recursive if c.type == 'MESH']
        irw = rig.matrix_world.inverted()

        for mesh in meshes:
            mw = mesh.matrix_world
            v_data = [(v.index, (irw @ (mw @ v.co)).length) for v in mesh.data.vertices]
            if not v_data: continue

            dists = [v[1] for v in v_data]
            max_d, min_d = max(dists), min(dists)
            bin_width = (max_d - min_d) / 10 if max_d > min_d else 1.0

            bin0_threshold = min_d + bin_width
            bin0_count = sum(1 for d in dists if d < bin0_threshold)

            bin9_threshold = min_d + (9 * bin_width)
            bin9_data = [v for v in v_data if v[1] >= bin9_threshold]

            to_delete_count = len(bin9_data) - bin0_count
            if to_delete_count <= 0: continue

            bin9_data.sort(key=lambda x: x[1], reverse=True)
            target_indices = {v[0] for v in bin9_data[:to_delete_count]}

            bm = bmesh.new()
            bm.from_mesh(mesh.data)
            bm.verts.ensure_lookup_table()
            verts_to_remove = [bm.verts[i] for i in target_indices if i < len(bm.verts)]
            bmesh.ops.delete(bm, geom=verts_to_remove, context='VERTS')
            bm.to_mesh(mesh.data)
            bm.free()
            mesh.data.update()

    def _get_metrics(self, rig):
        """Calculates height and ground Z using density clustering."""
        meshes = [c for c in rig.children_recursive if c.type == 'MESH']
        all_z = []
        for m in meshes:
            mw = m.matrix_world
            for v in m.data.vertices:
                all_z.append((mw @ v.co).z)
        if not all_z: return None

        min_z, max_z = min(all_z), max(all_z)
        span = max_z - min_z
        num_bins = 20
        bin_width = span / num_bins if span > 0 else 1.0

        bins = [0] * num_bins
        for z in all_z:
            idx = min(num_bins - 1, int((z - min_z) / bin_width)) if bin_width > 0 else 0
            bins[idx] += 1

        threshold = len(all_z) * 0.015
        true_ground_z, true_top_z = min_z, max_z

        for i, count in enumerate(bins):
            if count > threshold:
                true_ground_z = min_z + (i * bin_width)
                break
        for i in range(num_bins - 1, -1, -1):
            if bins[i] > threshold:
                true_top_z = min_z + ((i + 1) * bin_width)
                break

        return {"height": max(0.1, true_top_z - true_ground_z), "ground_z": true_ground_z}

    def apply_standard_renaming(self, obj, new_id, is_rig=False):
        suffix = "Rig" if is_rig else "Body"
        obj.name = f"{new_id}.{suffix}"

import bpy
import mathutils
import os
import config

class AssetManager:
    """Abstract Asset Manager synchronized with Movie 6 standards."""

    def __init__(self):
        self.coll_assets = config.config.coll_assets

    def ensure_collection(self, name):
        coll = bpy.data.collections.get(name) or bpy.data.collections.new(name)
        if bpy.context.scene.collection.children.get(coll.name) is None:
            bpy.context.scene.collection.children.link(coll)
        return coll

    def clear_scene(self):
        """Purges data-blocks for a reproducible clean start."""
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

        # Blender append can become unstable when the same ID is requested
        # multiple times in a single library load call (e.g. source_mesh and
        # source_rig both set to "skeleton"). Keep first occurrence order.
        unique_targets = []
        seen = set()
        for name in targets:
            if name and name not in seen:
                unique_targets.append(name)
                seen.add(name)

        if not unique_targets:
            return []

        coll = self.ensure_collection(self.coll_assets)

        with bpy.data.libraries.load(blend_path, link=False) as (data_from, data_to):
            data_to.objects = [n for n in unique_targets if n in data_from.objects]

        imported_objs = []
        for obj in data_to.objects:
            if obj:
                if coll.objects.get(obj.name) is None:
                    coll.objects.link(obj)
                imported_objs.append(obj)
                for child in obj.children_recursive:
                    if coll.objects.get(child.name) is None:
                        coll.objects.link(child)
        return imported_objs

    def normalize_character(self, rig, target_height):
        """Comprehensive normalization matching Movie 6 standards."""
        if not rig or rig.type != 'ARMATURE': return
        is_linked_asset = bool(rig.get("linked_asset", False))
        if config.config.get("normalization.enable_origin_reset", True) and not is_linked_asset:
            self.execute_origin_reset(rig)
        self.normalize_scale(rig, target_height)
        if config.config.get("normalization.enable_culling", True) and not is_linked_asset:
            self.execute_balanced_culling(rig)

    def execute_origin_reset(self, rig):
        import mathutils
        meshes = [c for c in rig.children_recursive if c.type == 'MESH']
        rig.location, rig.rotation_euler, rig.scale = (0,0,0), (0,0,0), (1,1,1)
        for m in meshes:
            m.parent = rig
            m.matrix_parent_inverse = mathutils.Matrix.Identity(4)
            m.location, m.rotation_euler, m.scale = (0,0,0), (0,0,0), (1,1,1)
        bpy.context.view_layer.update()
        metrics = self._get_metrics(rig)
        if metrics: rig.location.z -= metrics['ground_z']
        bpy.context.view_layer.update()

    def normalize_scale(self, rig, target_height):
        bpy.context.view_layer.update()
        metrics = self._get_metrics(rig)
        if not metrics or metrics['height'] < 0.001: return
        scale_factor = target_height / metrics['height']
        rig.scale *= scale_factor
        # Intentionally do not apply scale to avoid procedural double-transforms via Armature modifier
        bpy.context.view_layer.update()
        new_metrics = self._get_metrics(rig)
        if new_metrics: rig.location.z -= new_metrics['ground_z']
        bpy.context.view_layer.update()
        bpy.context.evaluated_depsgraph_get().update()

    def execute_balanced_culling(self, rig):
        import bmesh
        meshes = [c for c in rig.children_recursive if c.type == 'MESH']
        irw = rig.matrix_world.inverted()
        for mesh in meshes:
            mw = mesh.matrix_world
            v_data = [(v.index, (irw @ (mw @ v.co)).length) for v in mesh.data.vertices]
            if not v_data: continue
            dists = [v[1] for v in v_data]
            max_d, min_d = max(dists), min(dists)
            bin_width = (max_d - min_d) / 10 if max_d > min_d else 1.0
            bin0_count = sum(1 for d in dists if d < min_d + bin_width)
            bin9_data = [v for v in v_data if v[1] >= min_d + (9 * bin_width)]
            to_delete_count = len(bin9_data) - bin0_count
            if to_delete_count <= 0: continue
            bin9_data.sort(key=lambda x: x[1], reverse=True)
            target_indices = {v[0] for v in bin9_data[:to_delete_count]}
            bm = bmesh.new(); bm.from_mesh(mesh.data); bm.verts.ensure_lookup_table()
            verts_to_remove = [bm.verts[i] for i in target_indices if i < len(bm.verts)]
            bmesh.ops.delete(bm, geom=verts_to_remove, context='VERTS')
            bm.to_mesh(mesh.data); bm.free(); mesh.data.update()

    def _get_metrics(self, rig):
        if rig is None:
            return None
        bpy.context.view_layer.update()
        dg = bpy.context.evaluated_depsgraph_get()
        meshes = [c for c in rig.children_recursive if c.type == 'MESH']
        # Linked FBX-style assets are not always strict children of the armature.
        # Include any mesh using this rig in an Armature modifier so grounding
        # and normalization are based on the visible bound geometry.
        for obj in bpy.data.objects:
            if obj.type != 'MESH' or obj in meshes:
                continue
            arm_mod = next((m for m in obj.modifiers if m.type == 'ARMATURE' and m.object == rig), None)
            if arm_mod is not None or obj.parent == rig:
                meshes.append(obj)
        all_z = []
        for m in meshes:
            m_eval = m.evaluated_get(dg)
            mw = m_eval.matrix_world
            for corner in m_eval.bound_box:
                all_z.append((mw @ mathutils.Vector(corner)).z)
        if not all_z:
            return None
        min_z, max_z = min(all_z), max(all_z)
        return {"height": max(0.1, max_z - min_z), "ground_z": min_z}

    def apply_standard_renaming(self, obj, new_id, is_rig=False):
        obj.name = f"{new_id}.{'Rig' if is_rig else 'Body'}"

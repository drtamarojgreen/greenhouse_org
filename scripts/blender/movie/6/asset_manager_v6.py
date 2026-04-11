import bpy
import os
import sys

# Standardize path injection for movie/6 assets
V6_DIR = os.path.dirname(os.path.abspath(__file__))
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)

# prioritize assets_v6 for create_plant_humanoid_v6 etc.
ASSETS_V6_DIR = os.path.join(V6_DIR, "assets_v6")
if ASSETS_V6_DIR not in sys.path: sys.path.insert(0, ASSETS_V6_DIR)

# Robust import of config
try:
    import config
except ImportError:
    from . import config

from plant_humanoid_v6 import create_plant_humanoid_v6


class SylvanEnsembleManager:
    """Manages the linking, renaming, and integrity of the spirit ensemble."""

    def __init__(self):
        self.collection_name = "6a.ASSETS"
        self.ensemble  = config.SPIRIT_ENSEMBLE
        self.rig_map   = config.RIG_MAP_SRC

    def ensure_clean_slate(self):
        """Purges ALL data-blocks for a reproducible clean start."""
        for obj in list(bpy.data.objects):
            try:
                bpy.data.objects.remove(obj, do_unlink=True)
            except: pass

        for block in (bpy.data.meshes, bpy.data.armatures,
                      bpy.data.materials, bpy.data.cameras, bpy.data.lights,
                      bpy.data.images, bpy.data.actions, bpy.data.worlds):
            for item in list(block):
                try:
                    block.remove(item, do_unlink=True)
                except: pass

        bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)

    def link_ensemble(self):
        """Appends ensemble objects from the production blend."""
        if any(f"{art_name}" in obj.name for obj in bpy.data.objects for art_name in self.ensemble.values()):
             return

        coll = bpy.data.collections.get(self.collection_name) or bpy.data.collections.new(self.collection_name)
        if coll.name not in bpy.context.scene.collection.children:
            bpy.context.scene.collection.children.link(coll)

        src_mesh_names = list(self.ensemble.keys())
        src_rig_names  = list(self.rig_map.values())
        want = set(src_mesh_names + src_rig_names)

        if not os.path.exists(config.SPIRITS_ASSET_BLEND):
             return

        with bpy.data.libraries.load(config.SPIRITS_ASSET_BLEND, link=False) as (data_from, data_to):
            data_to.objects = [n for n in want if n in data_from.objects]

        for obj in data_to.objects:
            if obj and obj.name not in coll.objects:
                coll.objects.link(obj)
                obj["source_name"] = obj.name

    def link_protagonists(self):
        """Creates procedural protagonists."""
        create_plant_humanoid_v6(config.CHAR_HERBACEOUS, config.CHAR_HERBACEOUS_POS, height_scale=config.CHAR_HERBACEOUS_HEIGHT/1.5)
        create_plant_humanoid_v6(config.CHAR_ARBOR, config.CHAR_ARBOR_POS, height_scale=config.CHAR_ARBOR_HEIGHT/1.5)

    def normalize_character_scale(self, rig, target_height):
        """Scales rig and children to match target_height (world Z)."""
        if not rig: return

        # Ensure rig has children (meshes)
        meshes = [c for c in rig.children if c.type == 'MESH']
        if not meshes: return

        # Calculate current height (BBox max Z - min Z)
        # Using the meshes to get the actual geometry height
        import mathutils
        min_z, max_z = float('inf'), float('-inf')
        for m in meshes:
            for corner in m.bound_box:
                world_corner = m.matrix_world @ mathutils.Vector(corner)
                min_z = min(min_z, world_corner.z)
                max_z = max(max_z, world_corner.z)

        current_height = max_z - min_z
        if current_height > 0:
            scale_factor = target_height / current_height
            rig.scale *= scale_factor
            bpy.context.view_layer.update()

    def renormalize_objects(self):
        """Syncs spirit meshes to rigs."""
        coll = bpy.data.collections.get(self.collection_name)
        if not coll: return

        targets = []
        for src, art in self.ensemble.items():
             targets.append((src, art, "."))
        if "Root_Guardian" not in self.ensemble.values():
             targets.append(("skeleton", "Root_Guardian", "."))

        for src_mesh_name, art_name, sep in targets:
            t_mesh_name = f"{art_name}{sep}Body"
            t_rig_name  = f"{art_name}{sep}Rig"

            rig = bpy.data.objects.get(t_rig_name)
            if not rig:
                src_rig_name = self.rig_map.get(art_name) or (src_mesh_name if art_name == "Root_Guardian" else None)
                rig = (bpy.data.objects.get(src_rig_name) or
                       next((o for o in coll.objects if o.get("source_name") == src_rig_name), None))

            mesh = bpy.data.objects.get(t_mesh_name) or next((o for o in coll.objects if o.get("source_name") == src_mesh_name), None)

            if not mesh: continue
            if not rig: rig = mesh.find_armature()

            if mesh == rig:
                mesh_copy = mesh.copy()
                if mesh.data: mesh_copy.data = mesh.data.copy()
                coll.objects.link(mesh_copy)
                mesh = mesh_copy

            mesh.name = t_mesh_name
            if rig:
                rig.name = t_rig_name
                if mesh != rig:
                    mesh.parent = rig
                    mesh.location = (0, 0, 0)
                    mesh.rotation_euler = (0, 0, 0)
                    mesh.scale = (1, 1, 1)

                # Apply height-aware normalization
                target_h = 1.0
                if art_name == config.CHAR_HERBACEOUS: target_h = config.CHAR_HERBACEOUS_HEIGHT
                elif art_name == config.CHAR_ARBOR: target_h = config.CHAR_ARBOR_HEIGHT
                elif "Sylvan_Majesty" in art_name: target_h = config.MAJESTIC_HEIGHT
                elif "Verdant_Sprite" in art_name: target_h = config.SPRITE_HEIGHT
                elif "Phoenix" in art_name: target_h = config.PHEONIX_HEIGHT

                self.normalize_character_scale(rig, target_h)

                if mesh.type == 'MESH':
                    arm_mod = next((m for m in mesh.modifiers if m.type == 'ARMATURE'), None) or mesh.modifiers.new(name="Armature", type='ARMATURE')
                    arm_mod.object = rig

    def repair_materials(self):
        """Ensures spirit materials are linked (minimal logic)."""
        pass

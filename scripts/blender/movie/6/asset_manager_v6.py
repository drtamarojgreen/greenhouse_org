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
        self.collection_name = config.COLL_ASSETS
        self.ensemble  = config.SPIRIT_ENSEMBLE
        self.rig_map   = config.RIG_MAP_SRC
        self.linked_objects_map = {}

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
            print(f"ERROR: Production asset blend not found: {config.SPIRITS_ASSET_BLEND}. Skipping ensemble linking.")
            return

        with bpy.data.libraries.load(config.SPIRITS_ASSET_BLEND, link=False) as (data_from, data_to):
            data_to.objects = [n for n in want if n in data_from.objects]

        for obj in data_to.objects: # 'obj' is already the bpy.types.Object
            if obj and obj.name not in coll.objects:
                coll.objects.link(obj)
                obj["source_name"] = obj.name
                self.linked_objects_map[obj.name] = obj # Add to map
                # Recursively link children (Point 142)
                for child in obj.children_recursive:
                    if child.name not in coll.objects:
                        coll.objects.link(child)
                        self.linked_objects_map[child.name] = child # Add child to map

    def link_protagonists(self):
        """Creates procedural protagonists."""
        create_plant_humanoid_v6(config.CHAR_HERBACEOUS, config.CHAR_HERBACEOUS_POS)
        create_plant_humanoid_v6(config.CHAR_ARBOR, config.CHAR_ARBOR_POS)

    def normalize_character_scale(self, rig, target_height):
        """Calculates world-height from armature or mesh data and scales rig to match target."""
        if not rig: return

        # Ensure world-space coordinates are up to date
        bpy.context.view_layer.update()

        current_h = 0
        # Strategy 1: Prioritize Armature Bone Height (stable, bypasses mesh shards)
        if rig.type == 'ARMATURE' and rig.data.bones:
            z_vals = [ (rig.matrix_world @ b.head_local).z for b in rig.data.bones ] + \
                     [ (rig.matrix_world @ b.tail_local).z for b in rig.data.bones ]
            current_h = max(z_vals) - min(z_vals)
            print(f"ASSET_MANAGER: Normalizing {rig.name} via Armature Height: {current_h:.2f}m")

        # Strategy 2: Fallback to Robust Mesh Height (filtered)
        if current_h < 0.1:
            meshes = [c for c in rig.children_recursive if c.type == 'MESH']
            all_z = []
            for m in meshes:
                mw = m.matrix_world
                all_z.extend([(mw @ v.co).z for v in m.data.vertices])

            if all_z:
                all_z.sort()
                # 5th to 95th percentile filtering
                idx_min, idx_max = int(len(all_z)*0.05), int(len(all_z)*0.95)
                current_h = all_z[idx_max] - all_z[idx_min]
                print(f"ASSET_MANAGER: Normalizing {rig.name} via Filtered Mesh Height: {current_h:.2f}m")

        if current_h > 0.001:
            scale_factor = target_height / current_h
            # Clamp scale to prevent extreme distortions (e.g. 1000x scaling)
            scale_factor = max(0.1, min(scale_factor, 10.0))
            rig.scale *= scale_factor

    def renormalize_objects(self):
        """Syncs spirit meshes to rigs."""
        coll = bpy.data.collections.get(self.collection_name)
        if not coll: return

        targets = []
        for src, art in self.ensemble.items():
             targets.append((src, art, "."))
        # Root_Guardian has "skeleton" as both mesh and rig.
        # This prevents it being added twice.
        if "Root_Guardian" not in self.ensemble.values():
             targets.append(("skeleton", "Root_Guardian", "."))

        # --- Phase 1: Resolve all original objects from the map to avoid renaming conflicts ---
        resolved_objects = {} # Map art_name -> {"mesh": obj, "rig": obj}
        for src_mesh_name_key, art_name_value in self.ensemble.items():
            resolved_objects[art_name_value] = {}
            # Resolve mesh object
            mesh_obj = self.linked_objects_map.get(src_mesh_name_key)
            if mesh_obj:
                resolved_objects[art_name_value]["mesh"] = mesh_obj

            # Resolve rig object
            original_rig_name = self.rig_map.get(art_name_value)
            if original_rig_name:
                rig_obj = self.linked_objects_map.get(original_rig_name)
                if rig_obj:
                    resolved_objects[art_name_value]["rig"] = rig_obj

        # Special handling for Root_Guardian (if not already handled by ensemble map)
        if "Root_Guardian" in self.ensemble.values(): # It's in the ensemble
            skeleton_obj = self.linked_objects_map.get("skeleton")
            if skeleton_obj:
                # Ensure Root_Guardian entry exists and set its mesh/rig to skeleton_obj
                if "Root_Guardian" not in resolved_objects:
                    resolved_objects["Root_Guardian"] = {}
                resolved_objects["Root_Guardian"]["mesh"] = skeleton_obj
                resolved_objects["Root_Guardian"]["rig"] = skeleton_obj

        # --- Phase 2: Apply renames, parenting, and scaling using resolved objects ---
        for src_mesh_name_from_targets, art_name, sep in targets: # targets still has the original src names
            t_mesh_name = f"{art_name}{sep}Body"
            t_rig_name  = f"{art_name}{sep}Rig"

            resolved_entry = resolved_objects.get(art_name)
            if not resolved_entry: continue

            rig = resolved_entry.get("rig")
            mesh = resolved_entry.get("mesh")

            if not mesh or not rig: continue

            # Rename if necessary
            if mesh.name != t_mesh_name: mesh.name = t_mesh_name
            if rig.name != t_rig_name: rig.name = t_rig_name

            if mesh != rig:
                mesh.parent = rig
                mesh.location = (0, 0, 0)
                mesh.rotation_euler = (0, 0, 0)

            protags = [config.CHAR_HERBACEOUS, config.CHAR_ARBOR]
            is_protag = any(p in rig.name or p in art_name for p in protags)

            if not is_protag:
                target_h = 1.0
                if "Sylvan_Majesty" in art_name: target_h = config.MAJESTIC_HEIGHT
                elif "Verdant_Sprite" in art_name: target_h = config.SPRITE_HEIGHT
                elif "Phoenix" in art_name: target_h = config.PHOENIX_HEIGHT

                self.normalize_character_scale(rig, target_h)

            if mesh.type == 'MESH':
                arm_mod = next((m for m in mesh.modifiers if m.type == 'ARMATURE'), None) or mesh.modifiers.new(name="Armature", type='ARMATURE')
                arm_mod.object = rig

    def repair_materials(self):
        """Ensures spirit materials are linked (minimal logic)."""
        pass

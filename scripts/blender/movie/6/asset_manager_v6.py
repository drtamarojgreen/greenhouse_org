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

import animation_library_v6
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
        """Robustly scales rig using bone-to-bone height or robust percentile-based mesh filtering."""
        if not rig: return

        # Trigger update to ensure world matrices are current (Point 142)
        bpy.context.view_layer.update()

        current_h = 0

        # Method 1: Bone-to-Bone Height (Preferred for rigged spirits)
        if rig.type == 'ARMATURE':
            head = animation_library_v6.get_bone(rig, "Head")
            foot_l = animation_library_v6.get_bone(rig, "Foot.L")
            foot_r = animation_library_v6.get_bone(rig, "Foot.R")

            if head and (foot_l or foot_r):
                # Using PoseBone.head (local) transformed by matrix_world
                mw = rig.matrix_world
                h_z = (mw @ head.head).z
                f_z = (mw @ foot_l.head).z if foot_l else (mw @ foot_r.head).z
                current_h = abs(h_z - f_z)
                # Standard adjustment: bone-to-bone covers approx 85% of total height
                current_h *= 1.15

        # Method 2: Robust Percentile-based Mesh Fallback (Fallback or non-Mixamo)
        # We also calculate this and take the MAX of bone-height vs mesh-height
        # to ensure large head-props (majestic horns/branches) are accounted for.

        # Aggregate all vertices from rig's children or the object itself
        meshes = [c for c in rig.children if c.type == 'MESH']
        if rig.type == 'MESH': meshes.append(rig)
        # Recursively find meshes (for Sylvan_Majesty where body might be deep)
        for child in rig.children_recursive:
            if child.type == 'MESH' and child not in meshes:
                meshes.append(child)

        mesh_h = 0
        all_z = []
        for m in meshes:
            mw = m.matrix_world
            for v in m.data.vertices:
                all_z.append((mw @ v.co).z)

        if all_z:
            all_z.sort()
            # Use 0.5% - 99.5% to filter out extreme "shards" while keeping volume
            idx_min = int(len(all_z) * 0.005)
            idx_max = int(len(all_z) * 0.995)
            mesh_h = all_z[idx_max] - all_z[idx_min]

        if mesh_h > current_h:
            current_h = mesh_h

        if current_h > 0.001:
            scale_factor = target_height / current_h
            rig.scale *= scale_factor

    def renormalize_objects(self):
        """Syncs spirit meshes to rigs and resets parent inverses."""
        coll = bpy.data.collections.get(self.collection_name)
        if not coll: return

        # Ensure all meshes parented to rigs have Identity parent inverse to prevent scaling artifacts
        import mathutils
        for obj in list(coll.objects):
            if obj.type == 'MESH' and obj.parent and obj.parent.type == 'ARMATURE':
                # Force Identity matrix and reset local transforms to 0,0,0
                obj.matrix_parent_inverse = mathutils.Matrix.Identity(4)
                obj.location = (0, 0, 0)
                obj.rotation_euler = (0, 0, 0)
                obj.scale = (1, 1, 1)

        targets = []
        # Pre-populate map with all artistic names and their source components
        resolved_objects = {} # art_name -> {"mesh": obj, "rig": obj}

        for src_mesh, art_name in self.ensemble.items():
            if art_name not in resolved_objects:
                resolved_objects[art_name] = {"mesh": None, "rig": None}
            targets.append((src_mesh, art_name, "."))

        # Root_Guardian special handling in targets
        if "Root_Guardian" not in self.ensemble.values():
            resolved_objects["Root_Guardian"] = {"mesh": None, "rig": None}
            targets.append(("skeleton", "Root_Guardian", "."))

        # --- Phase 1: Resolve all original objects from the map to avoid renaming conflicts ---
        for src_mesh_name_key, art_name_value in self.ensemble.items():
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

        # Special handling for Root_Guardian resolution
        skeleton_obj = self.linked_objects_map.get("skeleton")
        if skeleton_obj:
            if "Root_Guardian" in resolved_objects:
                if not resolved_objects["Root_Guardian"]["mesh"]:
                    resolved_objects["Root_Guardian"]["mesh"] = skeleton_obj
                if not resolved_objects["Root_Guardian"]["rig"]:
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
                if mesh.parent != rig:
                    mesh.parent = rig
                mesh.location = (0, 0, 0)
                mesh.rotation_euler = (0, 0, 0)

            protags = [config.CHAR_HERBACEOUS, config.CHAR_ARBOR]
            is_protag = any(p in rig.name or p in art_name for p in protags)

            if not is_protag:
                # Default to sprite height for generic spirits
                target_h = config.SPRITE_HEIGHT
                if "Sylvan_Majesty" in art_name or "Radiant_Aura" in art_name:
                    target_h = config.MAJESTIC_HEIGHT
                elif "Verdant_Sprite" in art_name:
                    target_h = config.SPRITE_HEIGHT
                elif "Phoenix" in art_name:
                    target_h = config.PHOENIX_HEIGHT

                self.normalize_character_scale(rig, target_h)

            if mesh.type == 'MESH':
                arm_mod = next((m for m in mesh.modifiers if m.type == 'ARMATURE'), None) or mesh.modifiers.new(name="Armature", type='ARMATURE')
                arm_mod.object = rig

    def repair_materials(self):
        """Ensures spirit materials are linked (minimal logic)."""
        pass

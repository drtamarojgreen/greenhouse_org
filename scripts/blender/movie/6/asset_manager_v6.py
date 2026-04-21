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
import asset_normalization_functions
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
        """Unified Parent-First Scaling: Scales the Rig and lets parented meshes follow."""
        if not rig: return
        bpy.context.view_layer.update()

        # 1. Measure height using density metrics
        strategy = getattr(config, "HEIGHT_MEASURE_STRATEGY", "DENSITY")
        metrics = asset_normalization_functions.get_normalization_metrics(rig, strategy=strategy)
        if not metrics: return
        
        current_h = metrics['height']
        if current_h < 0.001: return
        
        scale_factor = target_height / current_h
        
        # 2. Scale Rig Object (Parent-First)
        # Because meshes are already parented at (0,0,0) local in execute_density_origin_reset,
        # scaling the rig will scale the meshes correctly from the feet.
        rig.scale = (rig.scale.x * scale_factor, rig.scale.y * scale_factor, rig.scale.z * scale_factor)
        
        # Apply scale to rig data for posing stability
        bpy.context.view_layer.objects.active = rig
        rig.select_set(True)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        rig.select_set(False)

        # 3. Explicit Final Grounding
        # Re-verify ground after scale just in case pivot wasn't exactly at 0
        bpy.context.view_layer.update()
        new_metrics = asset_normalization_functions.get_normalization_metrics(rig, strategy=strategy)
        if new_metrics:
            rig.location.z -= new_metrics['ground_z']
            
        bpy.context.view_layer.update()

    def renormalize_objects(self):
        """Syncs spirit meshes to rigs and resets parent inverses."""
        coll = bpy.data.collections.get(self.collection_name)
        if not coll: return

        # Ensure all meshes parented to rigs have Identity parent inverse to prevent visual scale/offset fracturing
        import mathutils
        for obj in list(bpy.data.objects):
            if obj.type == 'MESH' and obj.parent and obj.parent.type == 'ARMATURE':
                if not obj.matrix_parent_inverse.is_identity:
                    mw = obj.matrix_world.copy()
                    obj.matrix_parent_inverse = mathutils.Matrix.Identity(4)
                    obj.matrix_basis = obj.parent.matrix_world.inverted() @ mw
                
            if obj.type == 'ARMATURE':
                for pb in obj.pose.bones:
                    pb.rotation_mode = 'XYZ'

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
                # 1. PRIORITY PASS: Absolute Origin Reset (Must happen before any scale/grounding)
                if getattr(config, "ENABLE_ORIGIN_RESET", False):
                    asset_normalization_functions.execute_density_origin_reset(rig)

                # 2. NORMALIZATION PASS: Scaling (Now targeting centered geometry)
                # Default to sprite height for generic spirits
                target_h = config.SPRITE_HEIGHT
                if "Sylvan_Majesty" in art_name or "Radiant_Aura" in art_name:
                    target_h = config.MAJESTIC_HEIGHT
                elif "Verdant_Sprite" in art_name:
                    target_h = config.SPRITE_HEIGHT
                elif "Phoenix" in art_name:
                    target_h = config.PHOENIX_HEIGHT

                self.normalize_character_scale(rig, target_h)

                # 3. CLEANUP PASS: Statistical Culling
                if getattr(config, "ENABLE_STATISTICAL_CULLING", False):
                    asset_normalization_functions.execute_balanced_culling(rig, config)

            if mesh and mesh.type == 'MESH':
                arm_mod = next((m for m in mesh.modifiers if m.type == 'ARMATURE'), None) or mesh.modifiers.new(name="Armature", type='ARMATURE')
                arm_mod.object = rig
                
                # Apply Weight Polishing to ensure fluid animation and fix distortion
                self.polish_weights(mesh, rig)

    def polish_weights(self, mesh, rig):
        """Procedurally refines vertex weights to prevent distortion and ensure fluidity."""
        if not mesh or mesh.type != 'MESH': return

        # Set active and selected for operators
        bpy.context.view_layer.objects.active = mesh
        mesh.select_set(True)
        
        # 1. Normalize All Weights: Ensure total weight per vertex = 1.0
        # This prevents 'fighting' weights that cause spidery stretching.
        try:
            bpy.ops.object.mode_set(mode='OBJECT')
            bpy.ops.object.vertex_group_normalize_all(group_select_mode='ALL', lock_active=False)
            
            # 2. Iterative Smooth: Requires WEIGHT_PAINT mode to poll reliably in some versions
            bpy.ops.object.mode_set(mode='WEIGHT_PAINT')
            bpy.ops.object.vertex_group_smooth(group_select_mode='ALL', factor=0.5, repeat=2)
            bpy.ops.object.mode_set(mode='OBJECT')
        except Exception as e:
            print(f"WARNING: Could not polish weights for {mesh.name}: {e}")
            if mesh.mode != 'OBJECT': bpy.ops.object.mode_set(mode='OBJECT')

    def repair_materials(self):
        """Ensures spirit materials are linked (minimal logic)."""
        pass

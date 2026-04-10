import bpy
import os
import time
import config


class SylvanEnsembleManager:
    """Manages the linking, renaming, and integrity of the 8-character spirit ensemble."""

    def __init__(self):
        self.collection_name = "6a.ASSETS"
        self.ensemble  = config.SPIRIT_ENSEMBLE   # {src_mesh_name: art_name}
        self.rig_map   = config.RIG_MAP_SRC        # {art_name: src_armature_name}

    # ------------------------------------------------------------------
    # INITIALIZATION
    # ------------------------------------------------------------------

    def ensure_clean_slate(self):
        """Purges ALL data-blocks for a reproducible clean start."""
        print("ASSET_MANAGER: Executing Clean Scene Initialization...")

        # 1. Direct object removal (bypass selection context)
        for obj in list(bpy.data.objects):
            try:
                bpy.data.objects.remove(obj, do_unlink=True)
            except Exception:
                pass

        # 2. Comprehensive data-block purge
        for block in (bpy.data.meshes, bpy.data.armatures,
                      bpy.data.materials, bpy.data.cameras, bpy.data.lights,
                      bpy.data.images, bpy.data.actions, bpy.data.worlds):
            for item in list(block):
                try:
                    block.remove(item, do_unlink=True)
                except Exception:
                    pass

        # 3. Single orphan purge pass (was accidentally doubled before)
        bpy.ops.outliner.orphans_purge(
            do_local_ids=True, do_linked_ids=True, do_recursive=True
        )

    # ------------------------------------------------------------------
    # LINKING
    # ------------------------------------------------------------------

    def link_ensemble(self):
        """Appends all ensemble mesh + armature objects from the production blend."""
        print(f"ASSET_MANAGER: Linking Sylvan Ensemble from {config.SPIRITS_ASSET_BLEND}...")

        # 1. Check if already linked to prevent duplicates
        if any(f"{art_name}" in obj.name for obj in bpy.data.objects for art_name in self.ensemble.values()):
             print("ASSET_MANAGER: Ensemble already linked — skipping.")
             return

        # Ensure the SET.SPIRITS collection exists and is in the scene graph
        coll = bpy.data.collections.get(self.collection_name)
        if not coll:
            coll = bpy.data.collections.new(self.collection_name)
        if self.collection_name not in bpy.context.scene.collection.children:
            bpy.context.scene.collection.children.link(coll)

        # Build the list of source object names we want:
        #   - source mesh names (keys of SPIRIT_ENSEMBLE)
        #   - source armature names (values of RIG_MAP_SRC)
        #   - protagonist meshes and rigs
        src_mesh_names = list(self.ensemble.keys())
        src_rig_names  = list(self.rig_map.values())
        want = set(src_mesh_names + src_rig_names)

        if not os.path.exists(config.SPIRITS_ASSET_BLEND):
             print(f"ASSET_MANAGER ERROR: Source blend missing: {config.SPIRITS_ASSET_BLEND}")
             return

        with bpy.data.libraries.load(config.SPIRITS_ASSET_BLEND, link=False) as (data_from, data_to):
            available = set(data_from.objects)
            data_to.objects = [n for n in want if n in available]

        missing = want - set(data_from.objects if hasattr(data_from, 'objects') else [])
        if missing:
            print(f"ASSET_MANAGER WARNING: These source objects were not found in blend: {missing}")

        # Link only the newly loaded objects into the asset collection
        # This prevents existing environmental objects (cameras, backdrops) from being swept into 6a.ASSETS
        for obj in data_to.objects:
            if obj and obj.name not in coll.objects:
                try:
                    # Idempotency: Unlink from other collections if necessary
                    for other_coll in obj.users_collection:
                         if other_coll != coll:
                              other_coll.objects.unlink(obj)
                    coll.objects.link(obj)
                except RuntimeError:
                    pass

    def link_protagonists(self):
        """Appends protagonists from the v5 production blend."""
        print(f"ASSET_MANAGER: Linking Protagonists from {config.PROTAGONIST_SOURCE_BLEND}...")

        coll = bpy.data.collections.get(self.collection_name)
        if not coll:
            coll = bpy.data.collections.new(self.collection_name)
            if self.collection_name not in bpy.context.scene.collection.children:
                bpy.context.scene.collection.children.link(coll)

        want = {config.CHAR_HERBACEOUS, config.CHAR_ARBOR,
                f"{config.CHAR_HERBACEOUS}_Body", f"{config.CHAR_ARBOR}_Body",
                f"{config.CHAR_HERBACEOUS}_Rig", f"{config.CHAR_ARBOR}_Rig"}

        if os.path.exists(config.PROTAGONIST_SOURCE_BLEND):
            with bpy.data.libraries.load(config.PROTAGONIST_SOURCE_BLEND, link=False) as (data_from, data_to):
                available = set(data_from.objects)
                data_to.objects = [n for n in want if n in available]

            for obj in data_to.objects:
                if obj and obj.name not in coll.objects:
                    try:
                        # Idempotency: Unlink from other collections if necessary
                        for other_coll in obj.users_collection:
                             if other_coll != coll:
                                  other_coll.objects.unlink(obj)
                        coll.objects.link(obj)
                    except RuntimeError:
                        pass
        else:
            # Mocking protagonists for test environment if blend is missing
            print(f"ASSET_MANAGER WARNING: Protagonist blend missing, creating mocks.")
            for name in [config.CHAR_HERBACEOUS, config.CHAR_ARBOR]:
                mesh_name = f"{name}_Body"
                rig_name  = f"{name}_Rig"

                # Create Mock Rig
                rig_obj = bpy.data.objects.get(rig_name)
                if not rig_obj:
                    arm_data = bpy.data.armatures.new(rig_name)
                    rig_obj = bpy.data.objects.new(rig_name, arm_data)
                    coll.objects.link(rig_obj)

                # Create Mock Mesh
                mesh_obj = bpy.data.objects.get(mesh_name)
                if not mesh_obj:
                    bpy.ops.mesh.primitive_cube_add(size=2, location=(0,0,1))
                    mesh_obj = bpy.context.active_object
                    mesh_obj.name = mesh_name
                    if mesh_name not in coll.objects:
                         coll.objects.link(mesh_obj)

                # Enforce Parent-Child for mocks
                mesh_obj.parent = rig_obj
                # Restore Armature modifier for mocks
                arm_mod = next((m for m in mesh_obj.modifiers if m.type == 'ARMATURE'), None)
                if not arm_mod:
                    arm_mod = mesh_obj.modifiers.new(name="Armature", type='ARMATURE')
                arm_mod.object = rig_obj

    def import_fbx_ensemble(self):
        """Imports the Sylvan Ensemble from standalone FBX assets (Phase B workflow)."""
        asset_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
        print(f"ASSET_MANAGER: Importing Sylvan Ensemble from FBX: {asset_dir}")

        coll = bpy.data.collections.get(self.collection_name)
        if not coll:
            coll = bpy.data.collections.new(self.collection_name)
        if self.collection_name not in bpy.context.scene.collection.children:
            bpy.context.scene.collection.children.link(coll)

        for art_name in self.ensemble.values():
            fbx_path = os.path.join(asset_dir, f"{art_name}.fbx")
            if os.path.exists(fbx_path):
                # Ensure we import into the correct collection
                with bpy.context.temp_override(collection=coll):
                    bpy.ops.import_scene.fbx(filepath=fbx_path)
                print(f"  Imported: {art_name}")
            else:
                print(f"  WARNING: FBX not found for {art_name}: {fbx_path}")

    # ------------------------------------------------------------------
    # RENORMALIZATION
    # ------------------------------------------------------------------

    def renormalize_objects(self):
        """
        Final 5.0 Renormalization rewrite.
        Scopes changes ONLY to items in the asset collection to protect environment.
        """
        print("ASSET_MANAGER: Rewriting Scoped Asset Hierarchy...")

        coll = bpy.data.collections.get(self.collection_name)
        if not coll: return

        # Pre-pass: Capture original names and reset all rigs in the asset collection
        # We use a map to handle renaming collisions (e.g. 'skeleton' used by multiple chars)
        src_map = {obj.name: obj for obj in coll.objects}

        # Whitelist names for transformation reset
        # This prevents environmental armatures from being reset to identity
        valid_targets = []
        for art_name in config.RENORM_WHITELIST:
             is_p = art_name in (config.CHAR_HERBACEOUS, config.CHAR_ARBOR)
             sep = "_" if is_p else "."
             valid_targets.append(f"{art_name}{sep}Rig")
             valid_targets.append(f"{art_name}{sep}Body")
             # Add source names too
             src_name = next((k for k, v in self.ensemble.items() if v == art_name), art_name)
             valid_targets.append(src_name)
             src_rig = self.rig_map.get(art_name)
             if src_rig: valid_targets.append(src_rig)

        # Strictly scope pre-pass resets to the collection to protect environment
        for obj in coll.objects:
            if obj.type == 'ARMATURE':
                # Isolation: Ensure character rigs are unparented from non-asset containers
                mw = obj.matrix_world.copy()
                obj.parent = None
                obj.matrix_world = mw

                # ONLY reset scale/loc/rot for WHITELISTED characters
                if obj.name in valid_targets or any(v in obj.name for v in valid_targets):
                    obj.scale = (1, 1, 1)
                    obj.location = (0, 0, 0)
                    obj.rotation_euler = (0, 0, 0)

        # 1. Process Assets explicitly from the whitelist
        # This includes spirits (dots) and protagonists (underscores)
        for art_name in config.RENORM_WHITELIST:
            is_p = art_name in (config.CHAR_HERBACEOUS, config.CHAR_ARBOR)
            sep = "_" if is_p else "."
            t_mesh_name = f"{art_name}{sep}Body"
            t_rig_name  = f"{art_name}{sep}Rig"

            # Find source names from ensemble or use art_name as fallback
            src_mesh_key = next((k for k, v in self.ensemble.items() if v == art_name), art_name)

            # Find Mesh: Check original source first, then existing target name
            mesh = src_map.get(src_mesh_key) or bpy.data.objects.get(t_mesh_name)
            if not mesh and is_p:
                # Fallback for protagonists which might just be named 'Herbaceous_V5_Body'
                mesh = src_map.get(f"{art_name}_Body") or bpy.data.objects.get(f"{art_name}_Body")

            if not mesh:
                continue

            # Find Rig: Check mapping, then original name, then mesh itself if it's an armature
            src_rig_key = self.rig_map.get(art_name) or (f"{art_name}_Rig" if is_p else None)
            rig = (src_map.get(src_rig_key) if src_rig_key else None) or \
                  bpy.data.objects.get(t_rig_name) or \
                  mesh.find_armature()

            # Special case for skeleton-based assets where the mesh IS the rig (e.g. Root_Guardian)
            if not rig and mesh.type == 'ARMATURE':
                rig = mesh

            # Perform Renaming (Careful with shared rigs)
            if rig:
                # If mesh is rig (Root_Guardian), it MUST be named .Body
                if mesh == rig:
                    rig.name = t_mesh_name
                else:
                    # Mesh gets .Body, Rig gets .Rig
                    mesh.name = t_mesh_name
                    # Only rename the rig if it hasn't been processed yet or doesn't have a final name
                    if ".Rig" not in rig.name and ".Body" not in rig.name:
                        rig.name = t_rig_name

                rig.scale = (1, 1, 1) # Force unit scale to prevent inherited distortion

                # Enforce clean hierarchy: Mesh as child of Rig with identity transforms
                if mesh != rig:
                    # Isolation: Unparent rogue children (cameras, empties) from the rig
                    for child in list(rig.children):
                        if child != mesh:
                            # Preserve world position for rogue children when unparenting
                            mw_child = child.matrix_world.copy()
                            child.parent = None
                            child.matrix_world = mw_child

                    mesh.parent = rig
                    mesh.location = (0, 0, 0)
                    mesh.rotation_euler = (0, 0, 0)
                    mesh.scale = (1, 1, 1)
                else:
                    # If mesh is rig (Root_Guardian), ensure it has no parent
                    rig.parent = None

                # Restore Armature modifier correctly (only for MESH objects)
                if mesh.type == 'MESH':
                    mesh.constraints.clear()
                    arm_mod = next((m for m in mesh.modifiers if m.type == 'ARMATURE'), None)
                    if not arm_mod:
                        arm_mod = mesh.modifiers.new(name="Armature", type='ARMATURE')
                    if arm_mod:
                        arm_mod.object = rig

                rig.hide_render = rig.hide_viewport = False

            mesh.hide_render = mesh.hide_viewport = False

        # 2. Targeted cleanup: ensure all assets are visible
        for obj in coll.objects:
            obj.hide_render = obj.hide_viewport = False

    # ------------------------------------------------------------------
    # MATERIAL REPAIR
    # ------------------------------------------------------------------

    def repair_materials(self):
        """Rebuilds high-fidelity BSDF stacks with associated textures."""
        mapping = {
            "Sylvan_Majesty.Body":  config.TEX_LEAFY,
            "Radiant_Aura.Body":    config.TEX_JOY,
            "Verdant_Sprite.Body":  config.TEX_LEAFY,
            "Phoenix_Herald.Body":  config.TEX_JOY,
        }

        for mesh_name, tex_name in mapping.items():
            obj = bpy.data.objects.get(mesh_name)
            if not obj:
                continue

            mat_key = f"Mat.{mesh_name}"
            mat = bpy.data.materials.get(mat_key) or bpy.data.materials.new(name=mat_key)
            mat.use_nodes = True

            if not obj.data.materials:
                obj.data.materials.append(mat)
            else:
                obj.data.materials[0] = mat

            nodes = mat.node_tree.nodes
            nodes.clear()
            n_out  = nodes.new('ShaderNodeOutputMaterial')
            n_bsdf = nodes.new('ShaderNodeBsdfPrincipled')
            n_tex  = nodes.new('ShaderNodeTexImage')

            img_path = os.path.join(config.EQUIPMENT_DIR, tex_name)
            if os.path.exists(img_path):
                img = bpy.data.images.get(tex_name) or bpy.data.images.load(img_path)
                n_tex.image = img
            else:
                print(f"ASSET_MANAGER WARNING: Texture not found: {img_path}")

            links = mat.node_tree.links
            # Blender 5.0+ Principled BSDF uses "Base Color"
            target_socket = n_bsdf.inputs.get("Base Color") or n_bsdf.inputs[0]
            links.new(n_tex.outputs['Color'],  target_socket)
            links.new(n_bsdf.outputs['BSDF'],  n_out.inputs['Surface'])

    # ------------------------------------------------------------------
    # OPTIONAL: HEIGHT NORMALIZATION (disabled by default)
    # ------------------------------------------------------------------

    def force_majestic_height(self):
        """Scales rigs dynamically to reach the target height (e.g. 6 m)."""
        from animation_library_v6 import get_bone

        for art_name in self.ensemble.values():
            if art_name in (config.CHAR_HERBACEOUS, config.CHAR_ARBOR):
                continue

            rig = bpy.data.objects.get(f"{art_name}.Rig")
            if not rig:
                continue

            h_bone_names = ["Head", "Neck", "Spine2", "top"]
            f_bone_names = ["Foot.L", "Foot.R", "Hips", "bottom"]

            h_bone = next((get_bone(rig, b) for b in h_bone_names if get_bone(rig, b)), None)
            f_bone = next((get_bone(rig, b) for b in f_bone_names if get_bone(rig, b)), None)

            if h_bone and f_bone:
                bpy.context.view_layer.update()
                h_pos = (rig.matrix_world @ h_bone.head).z
                f_pos = (rig.matrix_world @ f_bone.tail).z
                current_h = abs(h_pos - f_pos)

                if current_h > 0:
                    scale_factor = config.MAJESTIC_HEIGHT / current_h
                    rig.scale    = tuple(s * scale_factor for s in rig.scale)
                    print(f"ASSET_MANAGER: Scaled {art_name} by {scale_factor:.2f} "
                          f"to reach {config.MAJESTIC_HEIGHT} m")
                    bpy.context.view_layer.update()

    def _normalize_vertex_groups(self, mesh, rig):
        """Ensures vertex group names match bone names exactly."""
        bone_names = {b.name for b in rig.pose.bones}
        for vg in mesh.vertex_groups:
            if vg.name not in bone_names:
                core = vg.name.replace("mixamorig:", "")
                for b_name in bone_names:
                    if core.lower() in b_name.lower():
                        vg.name = b_name
                        break

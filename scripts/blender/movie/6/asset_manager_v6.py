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
        # This prevents environmental objects (cameras, backdrops) from being swept into 6a.ASSETS
        for obj in bpy.data.objects:
            if (obj.name in want or any(obj.name.startswith(w) for w in want)) and obj.name not in coll.objects:
                try:
                    coll.objects.link(obj)
                    obj["source_name"] = obj.name
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

            for obj in bpy.data.objects:
                if obj.name in want and obj.name not in coll.objects:
                    try:
                        coll.objects.link(obj)
                        obj["source_name"] = obj.name
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
                    rig_obj["source_name"] = rig_name

                # Create Mock Mesh
                mesh_obj = bpy.data.objects.get(mesh_name)
                if not mesh_obj:
                    bpy.ops.mesh.primitive_cube_add(size=2, location=(0,0,1))
                    mesh_obj = bpy.context.active_object
                    mesh_obj.name = mesh_name
                    mesh_obj["source_name"] = mesh_name
                    if mesh_name not in coll.objects:
                         coll.objects.link(mesh_obj)

                # Enforce Parent-Child for mocks
                mesh_obj.parent = rig_obj
                # Restore Armature modifier for mocks
                arm_mod = next((m for m in mesh_obj.modifiers if m.type == 'ARMATURE'), None)
                if not arm_mod:
                    arm_mod = mesh_obj.modifiers.new(name="Armature", type='ARMATURE')

                if arm_mod:
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

    def sanitize_shards(self, obj):
        """Collapses rogue vertices (farther than 20m) to (0,0,0) to fix bounding boxes."""
        if not obj or obj.type != 'MESH' or obj.library: return

        # Guard against recursive modification of linked data
        if getattr(obj.data, "is_library_indirect", False): return

        print(f"ASSET_MANAGER: Sanitizing shards for {obj.name}...")
        sanitized_count = 0

        # Determine current scale factor to adjust threshold if needed
        # (Though we usually sanitize at identity scale during renormalization)

        for v in obj.data.vertices:
            # Check local space first (strict 20m threshold for character scale)
            if v.co.length > 20.0:
                v.co = (0, 0, 0)
                sanitized_count += 1
                continue

            # Check world space (only if object is at extreme world coordinates)
            w_co = obj.matrix_world @ v.co
            if w_co.length > 100.0:
                # If the vertex is at 100m while the object is near origin, it's a shard
                v.co = (0, 0, 0)
                sanitized_count += 1

        if sanitized_count > 0:
            print(f"  > Sanitized {sanitized_count} rogue vertices.")

    def renormalize_objects(self):
        """
        Final 5.0 Renormalization rewrite.
        Scopes changes ONLY to items in the asset collection to protect environment.
        """
        print("ASSET_MANAGER: Rewriting Scoped Asset Hierarchy...")

        coll = bpy.data.collections.get(self.collection_name)
        if not coll: return

        # 1. Build list of characters to process (Ensemble + Protagonists)
        targets = []
        seen_art_names = set()
        for src, art in self.ensemble.items():
             targets.append((src, art, "."))
             seen_art_names.add(art)

        # Pre-process Root_Guardian if not already in ensemble (fallback)
        if "Root_Guardian" not in seen_art_names:
             targets.append(("skeleton", "Root_Guardian", "."))
             seen_art_names.add("Root_Guardian")

        for art in (config.CHAR_HERBACEOUS, config.CHAR_ARBOR):
             targets.append((f"{art}_Body", art, "_"))

        # Snapshot of collection to find original sources even after renames
        orig_map = {o.name: o for o in coll.objects}

        for src_mesh_name, art_name, sep in targets:
            t_mesh_name = f"{art_name}{sep}Body"
            t_rig_name  = f"{art_name}{sep}Rig"

            # 1a. Resolve the Rig FIRST
            src_rig_name = self.rig_map.get(art_name) or (src_mesh_name if art_name == "Root_Guardian" else None)
            rig = bpy.data.objects.get(t_rig_name)

            if not rig and src_rig_name:
                # Search by exact name OR source_name property
                source_rig = (bpy.data.objects.get(src_rig_name) or
                              next((o for o in coll.objects if o.get("source_name") == src_rig_name), None))

                if source_rig:
                    # If it's already been renamed, it's 'claimed' by another spirit. Duplicate it.
                    if source_rig.name != src_rig_name:
                        rig = source_rig.copy()
                        if source_rig.data: rig.data = source_rig.data.copy()
                        coll.objects.link(rig)
                        rig["source_name"] = src_rig_name
                    else:
                        rig = source_rig

            # 1b. Resolve the Mesh
            mesh = bpy.data.objects.get(t_mesh_name)
            if not mesh:
                source_mesh = (bpy.data.objects.get(src_mesh_name) or
                               next((o for o in coll.objects if o.get("source_name") == src_mesh_name), None))

                if source_mesh:
                    # If it's already been renamed, it's 'claimed'. Duplicate.
                    if source_mesh.name != src_mesh_name:
                         mesh = source_mesh.copy()
                         if source_mesh.data: mesh.data = source_mesh.data.copy()
                         coll.objects.link(mesh)
                         mesh["source_name"] = src_mesh_name
                    else:
                         mesh = source_mesh

            if not mesh:
                print(f"ASSET_MANAGER WARNING: Could not resolve mesh for {art_name} (src: {src_mesh_name})")
                continue

            # Final fallback for rig if not yet found
            if not rig:
                rig = mesh.find_armature() or (mesh if mesh.type == 'ARMATURE' else None)

            # Special case: If mesh and rig are same object (skeleton-based), DUPLICATE to allow Sync
            if mesh == rig and mesh is not None:
                # Original becomes the Rig, copy becomes the Mesh
                mesh_copy = mesh.copy()
                if mesh.data: mesh_copy.data = mesh.data.copy()
                coll.objects.link(mesh_copy)
                mesh_copy["source_name"] = src_mesh_name
                mesh = mesh_copy # Proceed with the copy as the 'Body'

            mesh.name = t_mesh_name

            if rig:
                rig.name = t_rig_name

                # Sibling Protocol: Rig and Mesh both have parent = None
                # This prevents double-transform distortion from scale inheritance.
                if mesh != rig:
                    # Clear legacy animation on Mesh to prevent spatial offset
                    if mesh.animation_data:
                        mesh.animation_data_clear()

                    # Isolation: Unparent ALL children while keeping world transforms
                    for child in list(rig.children):
                        mw = child.matrix_world.copy()
                        child.parent = None
                        child.matrix_world = mw

                    for child in list(mesh.children):
                        mw = child.matrix_world.copy()
                        child.parent = None
                        child.matrix_world = mw

                    # Ensure mesh is sibling, not child
                    if mesh.parent is not None:
                        mw = mesh.matrix_world.copy()
                        mesh.parent = None
                        mesh.matrix_world = mw

                # Reset Rig transforms ONLY if not yet normalized to identity at origin.
                if not rig.get("normalized_height"):
                    rig.location = (0, 0, 0)
                    rig.rotation_euler = (0, 0, 0)
                    rig.scale = (1, 1, 1)

                # Apply shard sanitization to fix bounding boxes for normalization
                self.sanitize_shards(mesh)

                # Restore Armature modifier correctly (only for MESH objects)
                if mesh.type == 'MESH':
                    mesh.constraints.clear()
                    arm_mod = None
                    for m in mesh.modifiers:
                        if m.type == 'ARMATURE':
                            arm_mod = m
                            break
                    if not arm_mod:
                        try:
                            # Use mesh.modifiers.new which returns the modifier or raises error
                            arm_mod = mesh.modifiers.new(name="Armature", type='ARMATURE')
                        except Exception:
                            arm_mod = None

                    if arm_mod:
                        arm_mod.object = rig

                rig.hide_render = rig.hide_viewport = False

            mesh.hide_render = mesh.hide_viewport = False

        # 2. Targeted cleanup: ensure all assets are visible (no-hidden guardian)
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

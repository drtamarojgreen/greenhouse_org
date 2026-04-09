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

        # Link appended objects into the collection AND the scene view-layer
        for obj in bpy.data.objects:
            if obj.name not in coll.objects:
                try:
                    coll.objects.link(obj)
                except RuntimeError:
                    pass  # already in collection

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
                    except RuntimeError:
                        pass
        else:
            # Mocking protagonists for test environment if blend is missing
            print(f"ASSET_MANAGER WARNING: Protagonist blend missing, creating mocks.")
            for name in [config.CHAR_HERBACEOUS, config.CHAR_ARBOR]:
                mesh_name = f"{name}_Body"
                rig_name  = f"{name}_Rig"

                # Create Mock Rig
                if rig_name not in bpy.data.objects:
                    arm_data = bpy.data.armatures.new(rig_name)
                    rig_obj = bpy.data.objects.new(rig_name, arm_data)
                    coll.objects.link(rig_obj)
                else:
                    rig_obj = bpy.data.objects[rig_name]

                # Create Mock Mesh
                if mesh_name not in bpy.data.objects:
                    bpy.ops.mesh.primitive_cube_add(size=2, location=(0,0,1))
                    mesh_obj = bpy.context.active_object
                    mesh_obj.name = mesh_name
                else:
                    mesh_obj = bpy.data.objects[mesh_name]

                if mesh_obj.name not in coll.objects:
                    try:
                        coll.objects.link(mesh_obj)
                    except: pass

                # Parent for identification in tests
                mesh_obj.parent = rig_obj

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
        """Standardizes naming and basic hierarchy for production ensemble and protagonists."""
        print("ASSET_MANAGER: Executing Production Asset Renormalization...")
        
        # 1. Renormalize Ensemble Spirits
        for src_mesh, art_name in self.ensemble.items():
            is_protagonist = art_name in (config.CHAR_HERBACEOUS, config.CHAR_ARBOR)
            sep = "_" if is_protagonist else "."
            target_mesh_name = f"{art_name}{sep}Body"
            target_rig_name = f"{art_name}{sep}Rig"

            # 1. Asset Identification (Idempotent)
            mesh_obj = bpy.data.objects.get(target_mesh_name) or bpy.data.objects.get(src_mesh)
            if not mesh_obj:
                print(f"ASSET_MANAGER WARNING: Mesh '{art_name}' not found.")
                continue

            mesh_obj.name = target_mesh_name

            # 2. Rig Identification
            src_rig_name = self.rig_map.get(art_name)
            rig_obj = (bpy.data.objects.get(target_rig_name) or
                       (bpy.data.objects.get(src_rig_name) if src_rig_name else None) or
                       mesh_obj.find_armature())

            if rig_obj:
                rig_obj.name = target_rig_name
                rig_obj.parent = None

                # SIBLING HIERARCHY (Phase A Requirement)
                # We move both objects to the same origin to avoid double-transform distortion
                # while keeping them as top-level siblings.
                mesh_obj.parent = None

                # If the Rig has moved but the Mesh is still at origin, we sync them
                # but we do it PASSIVELY to avoid the "distorting everything" issue.
                # Only apply if Mesh is truly at origin and Rig has moved.
                if mesh_obj.location.length < 0.001 and rig_obj.location.length > 0.001:
                     mesh_obj.location = rig_obj.location.copy()
                     mesh_obj.rotation_euler = rig_obj.rotation_euler.copy()
                     mesh_obj.scale = rig_obj.scale.copy()

                # Ensure Armature modifier is present and targeting the rig
                arm_mod = next((m for m in mesh_obj.modifiers if m.type == 'ARMATURE'), None)
                if not arm_mod:
                    arm_mod = mesh_obj.modifiers.new(name="Armature", type='ARMATURE')
                arm_mod.object = rig_obj

                # Remove any harmful constraints that might cause distortion
                for con in list(mesh_obj.constraints):
                    if con.type == 'COPY_TRANSFORMS':
                        mesh_obj.constraints.remove(con)
            else:
                print(f"ASSET_MANAGER INFO: No rig found for '{art_name}' — skipping rig rename")

        # Restore full visibility (hidden objects cause render-safety confusion later)
        for obj in bpy.data.objects:
            obj.hide_render   = False
            obj.hide_viewport = False

        # Root_Guardian is a technical helper — keep it invisible
        for obj in bpy.data.objects:
            if "Root_Guardian" in obj.name:
                obj.hide_render   = True
                obj.hide_viewport = True
        

    def _renormalize_single_character(self, src_mesh, art_name, src_rig):
        mesh_obj = bpy.data.objects.get(src_mesh)
        if not mesh_obj:
            print(f"ASSET_MANAGER WARNING: Source mesh '{src_mesh}' not found for '{art_name}'")
            return

        # Protagonists use underscore separator; spirits use dot
        is_protagonist = art_name in (config.CHAR_HERBACEOUS, config.CHAR_ARBOR)
        sep = "_" if is_protagonist else "."
        mesh_obj.name = f"{art_name}{sep}Body"

        # Strip object-level parenting so mesh and rig are true siblings
        mesh_obj.parent = None
        if mesh_obj.type == 'MESH':
            mesh_obj.modifiers.clear()

        # Rename the corresponding rig (fall back to find_armature for legacy cases)
        rig_obj = bpy.data.objects.get(src_rig) if src_rig else mesh_obj.find_armature()

        if rig_obj:
            rig_obj.name  = f"{art_name}{sep}Rig"
            rig_obj.parent = None  # enforce sibling relationship

            # Restore Armature modifier to ensure mesh follows rig
            if mesh_obj.type == 'MESH':
                arm_mod = mesh_obj.modifiers.new(name="Armature", type='ARMATURE')
                arm_mod.object = rig_obj
        else:
            print(f"ASSET_MANAGER INFO: No rig found for '{art_name}' — skipping rig rename")

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

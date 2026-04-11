import bpy
import os
import time
import config


class SylvanEnsembleManager:
    """Manages the linking, renaming, and integrity of the 8-character spirit ensemble."""

    def __init__(self):
        self.collection_name = config.COLL_CHARACTERS
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

        # 3. Single orphan purge pass
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

        # Ensure the Characters collection exists and is in the scene graph
        coll = bpy.data.collections.get(self.collection_name)
        if not coll:
            coll = bpy.data.collections.new(self.collection_name)
        if self.collection_name not in bpy.context.scene.collection.children:
            bpy.context.scene.collection.children.link(coll)

        src_mesh_names = list(self.ensemble.keys())
        src_rig_names  = list(self.rig_map.values())
        want = set(src_mesh_names + src_rig_names)

        if not os.path.exists(config.SPIRITS_ASSET_BLEND):
             print(f"ASSET_MANAGER ERROR: Source blend missing: {config.SPIRITS_ASSET_BLEND}")
             return

        with bpy.data.libraries.load(config.SPIRITS_ASSET_BLEND, link=False) as (data_from, data_to):
            available = set(data_from.objects)
            data_to.objects = [n for n in want if n in available]

        # Link only the newly loaded objects into the asset collection
        for obj in bpy.data.objects:
            if (obj.name in want or any(obj.name.startswith(w) for w in want)) and obj.name not in coll.objects:
                try:
                    coll.objects.link(obj)
                    obj["source_name"] = obj.name
                except RuntimeError:
                    pass

    def link_protagonists(self):
        """Appends protagonists or creates them natively if blend is missing."""
        print(f"ASSET_MANAGER: Handling Protagonists...")

        coll = bpy.data.collections.get(self.collection_name)
        if not coll:
            coll = bpy.data.collections.new(self.collection_name)
            if self.collection_name not in bpy.context.scene.collection.children:
                bpy.context.scene.collection.children.link(coll)

        want = {config.CHAR_HERBACEOUS, config.CHAR_ARBOR,
                f"{config.CHAR_HERBACEOUS}_Body", f"{config.CHAR_ARBOR}_Body",
                f"{config.CHAR_HERBACEOUS}_Rig", f"{config.CHAR_ARBOR}_Rig"}

        if os.path.exists(config.PROTAGONIST_SOURCE_BLEND):
            print(f"ASSET_MANAGER: Linking Protagonists from {config.PROTAGONIST_SOURCE_BLEND}...")
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
            # Native port fallback for test environment
            print(f"ASSET_MANAGER: Creating Protagonists natively...")
            from assets_v6 import create_plant_humanoid_v6
            create_plant_humanoid_v6(config.CHAR_HERBACEOUS, config.CHAR_HERBACEOUS_POS)
            create_plant_humanoid_v6(config.CHAR_ARBOR, config.CHAR_ARBOR_POS)

    def import_fbx_ensemble(self):
        """Imports the Sylvan Ensemble from standalone FBX assets."""
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
                with bpy.context.temp_override(collection=coll):
                    bpy.ops.import_scene.fbx(filepath=fbx_path)
                print(f"  Imported: {art_name}")

    # ------------------------------------------------------------------
    # RENORMALIZATION
    # ------------------------------------------------------------------

    def renormalize_objects(self):
        """Scopes changes ONLY to items in the asset collection to protect environment."""
        print("ASSET_MANAGER: Rewriting Scoped Asset Hierarchy...")

        coll = bpy.data.collections.get(self.collection_name)
        if not coll: return

        targets = []
        seen_art_names = set()
        for src, art in self.ensemble.items():
             targets.append((src, art, "."))
             seen_art_names.add(art)

        if "Root_Guardian" not in seen_art_names:
             targets.append(("skeleton", "Root_Guardian", "."))
             seen_art_names.add("Root_Guardian")

        for art in (config.CHAR_HERBACEOUS, config.CHAR_ARBOR):
             targets.append((f"{art}_Body", art, "_"))

        for src_mesh_name, art_name, sep in targets:
            t_mesh_name = f"{art_name}{sep}Body"
            t_rig_name  = f"{art_name}{sep}Rig"

            src_rig_name = self.rig_map.get(art_name) or (src_mesh_name if art_name == "Root_Guardian" else None)
            rig = bpy.data.objects.get(t_rig_name)

            if not rig and src_rig_name:
                source_rig = (bpy.data.objects.get(src_rig_name) or
                              next((o for o in coll.objects if o.get("source_name") == src_rig_name), None))

                if source_rig:
                    if source_rig.name != src_rig_name:
                        rig = source_rig.copy()
                        if source_rig.data: rig.data = source_rig.data.copy()
                        coll.objects.link(rig)
                        rig["source_name"] = src_rig_name
                    else:
                        rig = source_rig

            mesh = bpy.data.objects.get(t_mesh_name)
            if not mesh:
                source_mesh = (bpy.data.objects.get(src_mesh_name) or
                               next((o for o in coll.objects if o.get("source_name") == src_mesh_name), None))

                if source_mesh:
                    if source_mesh.name != src_mesh_name:
                         mesh = source_mesh.copy()
                         if source_mesh.data: mesh.data = source_mesh.data.copy()
                         coll.objects.link(mesh)
                         mesh["source_name"] = src_mesh_name
                    else:
                         mesh = source_mesh

            if not mesh:
                continue

            if not rig:
                rig = mesh.find_armature() or (mesh if mesh.type == 'ARMATURE' else None)

            if mesh == rig and mesh is not None:
                mesh_copy = mesh.copy()
                if mesh.data: mesh_copy.data = mesh.data.copy()
                coll.objects.link(mesh_copy)
                mesh_copy["source_name"] = src_mesh_name
                mesh = mesh_copy

            mesh.name = t_mesh_name

            if rig:
                rig.name = t_rig_name
                if mesh != rig:
                    if mesh.animation_data:
                        mesh.animation_data_clear()

                    for child in list(rig.children):
                        if child != mesh:
                            mw = child.matrix_world.copy()
                            child.parent = None
                            child.matrix_world = mw

                    for child in list(mesh.children):
                        mw = child.matrix_world.copy()
                        child.parent = None
                        child.matrix_world = mw

                    mesh.parent = rig
                    mesh.location = (0, 0, 0)
                    mesh.rotation_euler = (0, 0, 0)
                    mesh.scale = (1, 1, 1)

                if not rig.get("normalized_height"):
                    rig.location = (0, 0, 0)
                    rig.rotation_euler = (0, 0, 0)
                    rig.scale = (1, 1, 1)

                if mesh.type == 'MESH':
                    mesh.constraints.clear()
                    arm_mod = next((m for m in mesh.modifiers if m.type == 'ARMATURE'), None)
                    if not arm_mod:
                        try:
                            arm_mod = mesh.modifiers.new(name="Armature", type='ARMATURE')
                        except Exception:
                            arm_mod = None
                    if arm_mod:
                        arm_mod.object = rig

                rig.hide_render = rig.hide_viewport = False
            mesh.hide_render = mesh.hide_viewport = False

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

            links = mat.node_tree.links
            target_socket = n_bsdf.inputs.get("Base Color") or n_bsdf.inputs[0]
            links.new(n_tex.outputs['Color'],  target_socket)
            links.new(n_bsdf.outputs['BSDF'],  n_out.inputs['Surface'])

    # ------------------------------------------------------------------
    # OPTIONAL: HEIGHT NORMALIZATION (disabled)
    # ------------------------------------------------------------------

    def force_majestic_height(self):
        """Scales rigs dynamically to reach the target height (e.g. 6 m)."""
        # DISABLED per user request to prevent distortion
        return

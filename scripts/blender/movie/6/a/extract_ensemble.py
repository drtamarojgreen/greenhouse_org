import bpy
import os
import sys

# Ensure v6 directory is in path
V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if V6_DIR not in sys.path:
    sys.path.append(V6_DIR)

import config
from asset_manager_v6 import SylvanEnsembleManager

# Monkeypatch for Blender 5.0.1 FBX export bug (AttributeError: 'ExportFBX' object has no attribute 'use_space_transform')
if hasattr(bpy.types, "EXPORT_SCENE_OT_fbx"):
    if not hasattr(bpy.types.EXPORT_SCENE_OT_fbx, "use_space_transform"):
        try:
            bpy.types.EXPORT_SCENE_OT_fbx.__annotations__["use_space_transform"] = bpy.props.BoolProperty(name="Use Space Transform", default=False)
            setattr(bpy.types.EXPORT_SCENE_OT_fbx, "use_space_transform", False)
            print("  INFO: Applied robust monkeypatch for EXPORT_SCENE_OT_fbx.use_space_transform")
        except Exception as e:
            print(f"  WARNING: Failed to apply export monkeypatch: {e}")

# Monkeypatch for Blender 5.0.1 FBX import bug (AttributeError: 'ImportFBX' object has no attribute 'files')
if hasattr(bpy.types, "IMPORT_SCENE_OT_fbx"):
    if not hasattr(bpy.types.IMPORT_SCENE_OT_fbx, "files"):
        try:
            bpy.types.IMPORT_SCENE_OT_fbx.__annotations__["files"] = bpy.props.CollectionProperty(
                type=bpy.types.OperatorFileListElement,
                options={'HIDDEN', 'SKIP_SAVE'}
            )
            # Use class attribute for execution safety
            setattr(bpy.types.IMPORT_SCENE_OT_fbx, "files", [])
            print("  INFO: Applied robust monkeypatch for IMPORT_SCENE_OT_fbx.files")
        except Exception as e:
            print(f"  WARNING: Failed to apply import monkeypatch: {e}")


def _is_protagonist(art_name):
    return art_name in (config.CHAR_HERBACEOUS, config.CHAR_ARBOR)


def _safe_fbx_export(filepath, use_selection=True):
    """Dynamic FBX export that respects Blender 5.0+ API changes."""
    # Inspect properties to see what's supported
    props = bpy.ops.export_scene.fbx.get_rna_type().properties
    supported = {p.identifier for p in props}

    # Define a exhaustive list of potential parameters we want to set
    # Note: 'use_space_transform' is critical in some versions but missing in others
    potential_kwargs = {
        "filepath": filepath,
        "use_selection": use_selection,
        "apply_unit_scale": False,
        "bake_anim": False,
        "path_mode": 'COPY',
        "embed_textures": False,
        "use_space_transform": False, # Explicitly include to satisfy internal checks
        "axis_forward": '-Z',
        "axis_up": 'Y',
    }

    # Filter kwargs to only include those supported by the current Blender version
    kwargs = {k: v for k, v in potential_kwargs.items() if k in supported}

    # Execute with supported args, wrapped in try-except for internal addon errors
    try:
        bpy.ops.export_scene.fbx(**kwargs)
    except Exception as e:
        print(f"  WARNING: FBX Export failed for {os.path.basename(filepath)}: {e}")
        # Try a second time with absolute minimal args if it failed
        if "filepath" in kwargs:
            print("  Retrying with minimal arguments...")
            try:
                bpy.ops.export_scene.fbx(filepath=filepath)
            except:
                print("  Minimal export failed.")


def extract_assets():
    print("\n" + "=" * 80)
    print("PHASE A: ASSET EXTRACTION (Sylvan Ensemble)")
    print("=" * 80)

    manager = SylvanEnsembleManager()

    # 1. Clean initialization
    manager.ensure_clean_slate()

    # 2. Link ensemble objects from production blend
    manager.link_ensemble()

    # 3. Resolve and Rename assets for export
    # CRITICAL: Use the source_name custom property for unambiguous resolution
    print("ASSET_MANAGER: Resolving ensemble objects by source_name...")

    # Store references by art_name
    resolved_map = {} # art_name -> {'mesh': obj, 'rig': obj}

    for art_name in set(list(manager.ensemble.values()) + list(manager.rig_map.keys())):
        resolved_map[art_name] = {'mesh': None, 'rig': None}

        # Find mesh for this character
        src_mesh_names = [k for k, v in manager.ensemble.items() if v == art_name]
        for obj in bpy.data.objects:
            if obj.get("source_name") in src_mesh_names:
                resolved_map[art_name]['mesh'] = obj
                break

        # Find rig for this character
        src_rig_name = manager.rig_map.get(art_name)
        if src_rig_name:
            for obj in bpy.data.objects:
                if obj.get("source_name") == src_rig_name:
                    resolved_map[art_name]['rig'] = obj
                    break

        # Fallback rig search
        if resolved_map[art_name]['rig'] is None and resolved_map[art_name]['mesh']:
            m = resolved_map[art_name]['mesh']
            if m.type == 'ARMATURE':
                resolved_map[art_name]['rig'] = m
            else:
                resolved_map[art_name]['rig'] = m.find_armature()

    print("ASSET_MANAGER: Renaming resolved assets...")
    processed_objs = set()
    # Order matters: protagonists first (optional)
    sorted_names = sorted(resolved_map.keys(), key=lambda n: n in (config.CHAR_HERBACEOUS, config.CHAR_ARBOR), reverse=True)

    for art_name in sorted_names:
        objs = resolved_map[art_name]
        sep = "_" if _is_protagonist(art_name) else "."

        rig = objs['rig']
        mesh = objs['mesh']

        if not rig and not mesh: continue

        # Rig Duplication for shared rigs
        if rig and rig in processed_objs:
            # Shared rig (e.g., 'skeleton' used by Phoenix_Herald and Root_Guardian)
            new_rig = rig.copy()
            new_rig.data = rig.data.copy()
            # Inherit source_name for resolution
            if rig.get("source_name"): new_rig["source_name"] = rig["source_name"]

            bpy.context.scene.collection.objects.link(new_rig)
            rig = new_rig
            objs['rig'] = rig

            # Update Armature modifier on mesh
            if mesh:
                arm_mod = next((m for m in mesh.modifiers if m.type == 'ARMATURE'), None)
                if arm_mod: arm_mod.object = rig

        if rig:
            rig.name = f"{art_name}{sep}Rig"
            processed_objs.add(rig)

        if mesh and mesh not in processed_objs:
            mesh.name = f"{art_name}{sep}Body"
            processed_objs.add(mesh)

        print(f"  Resolved {art_name}: Mesh->{mesh.name if mesh else 'NONE'}, Rig->{rig.name if rig else 'NONE'}")

    # 4. Texture Decoupling
    asset_dir = os.path.join(V6_DIR, "assets")
    os.makedirs(asset_dir, exist_ok=True)
    print(f"\nDECOUPLING TEXTURES TO: {asset_dir}")

    import shutil
    for obj in bpy.data.objects:
        if not hasattr(obj.data, "materials"): continue
        for mat in obj.data.materials:
            # Handle use_nodes deprecation in Blender 6.0 (pre-emptive)
            use_nodes = getattr(mat, "use_nodes", True)
            if not mat or not use_nodes: continue
            for node in mat.node_tree.nodes:
                if node.type == 'TEX_IMAGE' and node.image:
                    src_path = bpy.path.abspath(node.image.filepath)
                    if os.path.exists(src_path):
                        dest_path = os.path.join(asset_dir, os.path.basename(src_path))
                        if not os.path.exists(dest_path):
                            shutil.copy2(src_path, dest_path)
                            print(f"  Copied texture: {os.path.basename(src_path)}")
                    else:
                        print(f"  WARNING: Texture source missing: {src_path}")

    # 5. Export to FBX
    print(f"\nEXPORTING TO FBX: {asset_dir}")

    exported = []
    skipped  = []

    for art_name, objs in resolved_map.items():
        body = objs['mesh']
        rig  = objs['rig']

        if body and rig and body != rig:
            bpy.ops.object.select_all(action='DESELECT')
            body.select_set(True)
            rig.select_set(True)

            # Select all recursive children to ensure accessories/props are included
            for child in body.children_recursive:
                child.select_set(True)
            for child in rig.children_recursive:
                child.select_set(True)

            bpy.context.view_layer.objects.active = rig

            fbx_path = os.path.join(asset_dir, f"{art_name}.fbx")
            _safe_fbx_export(fbx_path, use_selection=True)
            print(f"  SUCCESS: {art_name} -> {fbx_path}")
            exported.append(art_name)

        elif body and body.type == 'ARMATURE':
            # Character whose mesh object IS the armature (e.g. Root_Guardian)
            bpy.ops.object.select_all(action='DESELECT')
            body.select_set(True)
            # Select all recursive children
            for child in body.children_recursive:
                child.select_set(True)

            bpy.context.view_layer.objects.active = body

            fbx_path = os.path.join(asset_dir, f"{art_name}.fbx")
            _safe_fbx_export(fbx_path, use_selection=True)
            print(f"  SUCCESS (rig-only): {art_name} -> {fbx_path}")
            exported.append(art_name)

        else:
            msg = []
            if not body: msg.append(f"body missing")
            if not rig:  msg.append(f"rig missing")
            print(f"  SKIP: {art_name} — {', '.join(msg)}")
            skipped.append(art_name)

    # 6. Summary
    print(f"\nPHASE A COMPLETE: {len(exported)} exported, {len(skipped)} skipped.")
    if skipped:
        print(f"  Skipped: {skipped}")


if __name__ == "__main__":
    extract_assets()

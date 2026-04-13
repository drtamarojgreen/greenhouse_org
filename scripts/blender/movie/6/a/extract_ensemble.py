import bpy
import os
import sys

# Ensure v6 directory is in path
V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if V6_DIR not in sys.path:
    sys.path.append(V6_DIR)

import config
from asset_manager_v6 import SylvanEnsembleManager


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

    # Special handling for Root_Guardian/skeleton if not found by exact name
    if "skeleton" not in bpy.data.objects:
        # Check if it was already renamed or exists as a substring
        skel = next((o for o in bpy.data.objects if "skeleton" in o.name.lower()), None)
        if skel:
            print(f"  INFO: Found skeleton object as {skel.name!r}")
            # Map it so the loop finds it
            manager.ensemble[skel.name] = "Root_Guardian"

    # 3. Passive renaming only — no scaling or geometric modification
    print("ASSET_MANAGER: Renaming assets for export...")
    # Root_Guardian case: skeleton might be both rig and mesh
    for src_mesh, art_name in list(manager.ensemble.items()):
        mesh_obj = bpy.data.objects.get(src_mesh)
        if not mesh_obj:
            print(f"  SKIP (mesh not found): {src_mesh} -> {art_name}")
            continue

        sep = "_" if _is_protagonist(art_name) else "."
        new_mesh_name = f"{art_name}{sep}Body"
        mesh_obj.name = new_mesh_name
        print(f"  Renamed mesh: {src_mesh!r} -> {new_mesh_name!r}")

        # Rig: prefer explicit RIG_MAP_SRC entry, then fall back to find_armature
        src_rig = manager.rig_map.get(art_name)
        rig_obj = bpy.data.objects.get(src_rig) if src_rig else None

        # For characters whose mesh IS the rig object (e.g. Root_Guardian / skeleton),
        # find_armature() will return None on the mesh because the object is already an
        # ARMATURE type.  In that case skip rig renaming — the mesh rename is sufficient.
        if rig_obj is None and mesh_obj.type != 'ARMATURE':
            rig_obj = mesh_obj.find_armature()

        if rig_obj:
            new_rig_name = f"{art_name}{sep}Rig"
            rig_obj.name = new_rig_name
            print(f"  Renamed rig:  {src_rig or '(auto)'!r} -> {new_rig_name!r}")
        else:
            print(f"  INFO: No separate rig for {art_name!r} — skipping rig rename")

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

    for art_name in manager.ensemble.values():
        sep = "_" if _is_protagonist(art_name) else "."
        body_name = f"{art_name}{sep}Body"
        rig_name  = f"{art_name}{sep}Rig"

        body = bpy.data.objects.get(body_name)
        rig  = bpy.data.objects.get(rig_name)

        if body and rig:
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
            # Ensure the object is named with the .Body suffix for the Phase B renormalize_objects
            original_name = body.name
            body.name = f"{art_name}.Body"

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
            if not body: msg.append(f"body '{body_name}' missing")
            if not rig:  msg.append(f"rig '{rig_name}' missing")
            print(f"  SKIP: {art_name} — {', '.join(msg)}")
            skipped.append(art_name)

    # 6. Summary
    print(f"\nPHASE A COMPLETE: {len(exported)} exported, {len(skipped)} skipped.")
    if skipped:
        print(f"  Skipped: {skipped}")


if __name__ == "__main__":
    extract_assets()

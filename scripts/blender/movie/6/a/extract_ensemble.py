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


def extract_assets():
    print("\n" + "=" * 80)
    print("PHASE A: ASSET EXTRACTION (Sylvan Ensemble)")
    print("=" * 80)

    manager = SylvanEnsembleManager()

    # 1. Clean initialization
    manager.ensure_clean_slate()

    # 2. Link ensemble objects from production blend
    manager.link_ensemble()

    # 3. Passive renaming only — no scaling or geometric modification
    print("ASSET_MANAGER: Renaming assets for export...")
    for src_mesh, art_name in manager.ensemble.items():
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

    # 4. Export to FBX
    asset_dir = os.path.join(V6_DIR, "assets")
    os.makedirs(asset_dir, exist_ok=True)
    print(f"\nEXPORTING TO: {asset_dir}")

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
            bpy.context.view_layer.objects.active = rig

            fbx_path = os.path.join(asset_dir, f"{art_name}.fbx")
            bpy.ops.export_scene.fbx(
                filepath=fbx_path,
                use_selection=True,
                apply_unit_scale=False,  # maintain raw scale per Phase A spec
                bake_anim=False,
            )
            print(f"  SUCCESS: {art_name} -> {fbx_path}")
            exported.append(art_name)

        elif body and body.type == 'ARMATURE':
            # Character whose mesh object IS the armature (e.g. Root_Guardian)
            bpy.ops.object.select_all(action='DESELECT')
            body.select_set(True)
            bpy.context.view_layer.objects.active = body

            fbx_path = os.path.join(asset_dir, f"{art_name}.fbx")
            bpy.ops.export_scene.fbx(
                filepath=fbx_path,
                use_selection=True,
                apply_unit_scale=False,
                bake_anim=False,
            )
            print(f"  SUCCESS (rig-only): {art_name} -> {fbx_path}")
            exported.append(art_name)

        else:
            msg = []
            if not body: msg.append(f"body '{body_name}' missing")
            if not rig:  msg.append(f"rig '{rig_name}' missing")
            print(f"  SKIP: {art_name} — {', '.join(msg)}")
            skipped.append(art_name)

    # 5. Summary
    print(f"\nPHASE A COMPLETE: {len(exported)} exported, {len(skipped)} skipped.")
    if skipped:
        print(f"  Skipped: {skipped}")


if __name__ == "__main__":
    extract_assets()

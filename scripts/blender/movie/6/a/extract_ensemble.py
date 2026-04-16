import bpy
import os
import sys

# Ensure v6 directory is in path
V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if V6_DIR not in sys.path:
    sys.path.append(V6_DIR)

import config
from asset_manager_v6 import SylvanEnsembleManager

# Monkeypatch for Blender 5.0.1 FBX operator bugs
def _apply_fbx_patches():
    if hasattr(bpy.types, "EXPORT_SCENE_OT_fbx"):
        try:
            op_cls = bpy.types.EXPORT_SCENE_OT_fbx
            if "use_space_transform" not in op_cls.__annotations__:
                op_cls.__annotations__["use_space_transform"] = bpy.props.BoolProperty(
                    name="Use Space Transform", default=False)
            if not hasattr(op_cls, "use_space_transform"):
                setattr(op_cls, "use_space_transform", False)
                print("  INFO: Applied robust monkeypatch for EXPORT_SCENE_OT_fbx.use_space_transform")
        except Exception as e:
            print(f"  WARNING: Failed to apply export monkeypatch: {e}")

    if hasattr(bpy.types, "IMPORT_SCENE_OT_fbx"):
        try:
            op_cls = bpy.types.IMPORT_SCENE_OT_fbx
            if "files" not in op_cls.__annotations__:
                op_cls.__annotations__["files"] = bpy.props.CollectionProperty(
                    type=bpy.types.OperatorFileListElement, options={'HIDDEN', 'SKIP_SAVE'})
            if not hasattr(op_cls, "files"):
                setattr(op_cls, "files", [])
                print("  INFO: Applied robust monkeypatch for IMPORT_SCENE_OT_fbx.files")
        except Exception as e:
            print(f"  WARNING: Failed to apply import monkeypatch: {e}")

_apply_fbx_patches()


def _is_protagonist(art_name):
    return art_name in (config.CHAR_HERBACEOUS, config.CHAR_ARBOR)


def _safe_fbx_export(filepath, use_selection=True):
    """Dynamic FBX export that respects Blender 5.0+ API changes."""
    # Inspect properties to see what's supported
    props = bpy.ops.export_scene.fbx.get_rna_type().properties
    supported = {p.identifier for p in props}

    potential_kwargs = {
        "filepath": filepath,
        "use_selection": use_selection,
        "apply_unit_scale": False,
        "bake_anim": False,
        "path_mode": 'COPY',
        "embed_textures": False,
        "use_space_transform": False,
        "axis_forward": '-Z',
        "axis_up": 'Y',
    }

    kwargs = {k: v for k, v in potential_kwargs.items() if k in supported}

    try:
        if os.path.exists(filepath):
            os.remove(filepath)

        bpy.ops.export_scene.fbx(**kwargs)

        if not os.path.exists(filepath):
            raise RuntimeError(f"FBX file was not created: {filepath}")

    except Exception as e:
        print(f"  WARNING: FBX Export failed for {os.path.basename(filepath)}: {e}")
        if "filepath" in kwargs:
            print("  Retrying with minimal arguments...")
            try:
                bpy.ops.export_scene.fbx(filepath=filepath)
                if not os.path.exists(filepath):
                    print("  Minimal export failed to produce file.")
            except Exception as e2:
                print(f"  Minimal export failed: {e2}")


def extract_assets():
    print("\n" + "=" * 80)
    print("PHASE A: ASSET EXTRACTION (Sylvan Ensemble)")
    print("=" * 80)

    manager = SylvanEnsembleManager()
    manager.ensure_clean_slate()
    manager.link_ensemble()

    print("ASSET_MANAGER: Resolving ensemble objects...")
    resolved_map = {}

    all_art_names = set(list(manager.ensemble.values()) + list(manager.rig_map.keys()))
    for name in all_art_names: resolved_map[name] = {'mesh': None, 'rig': None}

    for obj in bpy.data.objects:
        src = obj.get("source_name")
        if not src: continue
        for art, rig_src in manager.rig_map.items():
            if src == rig_src: resolved_map[art]['rig'] = obj
        for mesh_src, art in manager.ensemble.items():
            if src == mesh_src: resolved_map[art]['mesh'] = obj

    for art_name, objs in resolved_map.items():
        if objs['mesh'] is None:
            src_mesh_names = [k for k, v in manager.ensemble.items() if v == art_name]
            for n in src_mesh_names:
                o = bpy.data.objects.get(n)
                if o: objs['mesh'] = o; break

        if objs['rig'] is None:
            # Special case: rig might be the same object as mesh (e.g. Root_Guardian)
            if art_name == "Root_Guardian" and objs['mesh'] and objs['mesh'].type == 'ARMATURE':
                objs['rig'] = objs['mesh']
            else:
                src_rig = manager.rig_map.get(art_name)
                if src_rig:
                    o = bpy.data.objects.get(src_rig)
                    if o: objs['rig'] = o

    print("ASSET_MANAGER: Handling shared rigs and renaming...")
    processed_objs = set()
    sorted_names = sorted(resolved_map.keys(), key=lambda n: n in (config.CHAR_HERBACEOUS, config.CHAR_ARBOR), reverse=True)

    for art_name in sorted_names:
        objs = resolved_map[art_name]
        sep = "_" if _is_protagonist(art_name) else "."
        rig = objs['rig']
        mesh = objs['mesh']

        if not rig and not mesh: continue

        if rig and rig in processed_objs:
            new_rig = rig.copy()
            new_rig.data = rig.data.copy()
            if rig.get("source_name"): new_rig["source_name"] = rig["source_name"]
            bpy.context.scene.collection.objects.link(new_rig)
            rig = new_rig
            objs['rig'] = rig
            if mesh:
                mod = next((m for m in mesh.modifiers if m.type == 'ARMATURE'), None)
                if mod: mod.object = rig

        if rig:
            rig.name = f"{art_name}{sep}Rig"
            processed_objs.add(rig)
        if mesh and mesh not in processed_objs:
            mesh.name = f"{art_name}{sep}Body"
            processed_objs.add(mesh)

        print(f"  Resolved {art_name}: Mesh->{mesh.name if mesh else 'NONE'}, Rig->{rig.name if rig else 'NONE'}")

    asset_dir = os.path.join(V6_DIR, "assets")
    os.makedirs(asset_dir, exist_ok=True)
    print(f"\nDECOUPLING TEXTURES TO: {asset_dir}")

    import shutil
    for obj in bpy.data.objects:
        if not hasattr(obj.data, "materials"): continue
        for mat in obj.data.materials:
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

    print(f"\nEXPORTING TO FBX: {asset_dir}")

    exported = []
    skipped  = []

    for art_name, objs in resolved_map.items():
        body = objs['mesh']
        rig  = objs['rig']
        fbx_path = os.path.join(asset_dir, f"{art_name}.fbx")

        if body and rig and body != rig:
            bpy.ops.object.select_all(action='DESELECT')
            body.select_set(True)
            rig.select_set(True)
            for child in body.children_recursive:
                child.select_set(True)
            for child in rig.children_recursive:
                child.select_set(True)
            bpy.context.view_layer.objects.active = rig
            _safe_fbx_export(fbx_path, use_selection=True)

        elif body and body.type == 'ARMATURE':
            bpy.ops.object.select_all(action='DESELECT')
            body.select_set(True)
            for child in body.children_recursive:
                child.select_set(True)
            bpy.context.view_layer.objects.active = body
            _safe_fbx_export(fbx_path, use_selection=True)

        else:
            msg = []
            if not body: msg.append(f"body missing")
            if not rig:  msg.append(f"rig missing")
            print(f"  SKIP: {art_name} — {', '.join(msg)}")
            skipped.append(art_name)
            continue

        if os.path.exists(fbx_path):
            print(f"  SUCCESS: {art_name} -> {fbx_path}")
            exported.append(art_name)
        else:
            print(f"  FAILURE: {art_name} export failed silently")
            skipped.append(art_name)

    print(f"\nPHASE A COMPLETE: {len(exported)} exported, {len(skipped)} skipped.")
    if skipped:
        print(f"  Skipped: {skipped}")


if __name__ == "__main__":
    extract_assets()

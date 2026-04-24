import bpy
import os
import sys

# Ensure v6 directory is in path
V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if V6_DIR not in sys.path:
    sys.path.append(V6_DIR)

import config
from asset_manager_v6 import SylvanEnsembleManager

# Monkeypatch for Blender 5.1 FBX operator bugs
def _apply_fbx_patches():
    if hasattr(bpy.types, "EXPORT_SCENE_OT_fbx"):
        try:
            op_cls = bpy.types.EXPORT_SCENE_OT_fbx
            # Blender 5.1 might have changed property registration
            for prop_name in ["use_space_transform", "apply_unit_scale", "use_selection"]:
                if not hasattr(op_cls, prop_name):
                    op_cls.__annotations__[prop_name] = bpy.props.BoolProperty(name=prop_name, default=True if "selection" in prop_name else False)
                    setattr(op_cls, prop_name, True if "selection" in prop_name else False)
            print("  INFO: Applied robust monkeypatch for EXPORT_SCENE_OT_fbx")
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
        "add_leaf_bones": False,
        "path_mode": 'COPY',
        "embed_textures": True,
        "use_space_transform": False,
        "axis_forward": '-Z',
        "axis_up": 'Y',
    }

    kwargs = {k: v for k, v in potential_kwargs.items() if k in supported}

    try:
        # Force all images to be packed before export
        for img in bpy.data.images:
            if not img.packed_file:
                img.pack()

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
    print("PHASE A: ASSET EXTRACTION (Direct Export)")
    print("=" * 80)

    # Import config and ensure latest
    import importlib
    importlib.reload(config)
    manager = SylvanEnsembleManager()
    manager.ensure_clean_slate()
    manager.link_ensemble(source='BLEND')
    
    asset_dir = os.path.join(V6_DIR, "assets")
    os.makedirs(asset_dir, exist_ok=True)
    
    exported = []
    
    # Iterate using the rig_map directly from config
    for art_name, rig_name in config.RIG_MAP_SRC.items():
        print(f"DIRECTOR: Preparing {art_name} (Look for: {rig_name})...")
        
        # Look for the armature by the internal name found in audit
        rig = bpy.data.objects.get(rig_name)
        
        if rig:
            fbx_path = os.path.join(asset_dir, f"{art_name}.fbx")
            
            # Select everything in the rig's hierarchy
            bpy.ops.object.select_all(action='DESELECT')
            rig.select_set(True)
            for obj in rig.children_recursive:
                obj.select_set(True)
            bpy.context.view_layer.objects.active = rig
            
            _safe_fbx_export(fbx_path, use_selection=True)
            
            if os.path.exists(fbx_path):
                exported.append(art_name)
                print(f"  SUCCESS: {art_name} exported.")
        else:
            print(f"  SKIP: {art_name} rig not found (looked for: {rig_name}).")

    print(f"\nPHASE A COMPLETE: {len(exported)} exported.")


if __name__ == "__main__":
    extract_assets()

import bpy
import os
import sys
import time

# Ensure movie root and v6 are in path for shared utility access
V6_DIR    = os.path.dirname(os.path.abspath(__file__))
MOVIE_ROOT = os.path.dirname(V6_DIR)
if MOVIE_ROOT not in sys.path: sys.path.append(MOVIE_ROOT)
if V6_DIR    not in sys.path: sys.path.append(V6_DIR)

import config
from asset_manager_v6 import SylvanEnsembleManager
from director_v6 import SylvanDirector
from dialogue_scene_v6 import DialogueSceneV6
from chroma_green_setup import setup_chroma_green_backdrop


# ---------------------------------------------------------------------------
# HEIGHT NORMALIZATION HELPERS  (defined here so they are importable and
# so standardize_ensemble_heights() can call force_majestic_height() without
# a circular import)
# ---------------------------------------------------------------------------

def force_majestic_height(rig, target_h):
    """World-space bone-based height normalization for a single rig."""
    from animation_library_v6 import get_bone

    head = get_bone(rig, "Head") or get_bone(rig, "Neck")
    foot = (get_bone(rig, "Foot.L")
            or get_bone(rig, "Foot.R")
            or get_bone(rig, "LeftFoot")
            or get_bone(rig, "Hips"))

    if head and foot:
        bpy.context.view_layer.update()
        # Find the Mesh child
        mesh = next((o for o in bpy.data.objects if o.parent == rig or rig.name.replace(".Rig", ".Body") == o.name), None)

        # Calculate Current Height in World Space
        h_pos  = (rig.matrix_world @ head.head).z
        f_pos  = (rig.matrix_world @ foot.tail).z
        curr_h = abs(h_pos - f_pos)

        if curr_h > 0.01:
            factor = target_h / curr_h

            # If factor is near 1.0, we're already normalized
            if 0.99 < factor < 1.01:
                 return

            # Movie 6: Scale BOTH Rig and Mesh to maintain sync in Sibling hierarchy
            rig.scale = tuple(s * factor for s in rig.scale)
            if mesh and mesh != rig:
                 mesh.scale = tuple(s * factor for s in mesh.scale)
                 print(f"ASSET_MANAGER: Scaled Rig {rig.name} and Mesh {mesh.name} by {factor:.2f} (Current: {curr_h:.2f}m)")
            else:
                 print(f"ASSET_MANAGER: Scaled Rig {rig.name} by {factor:.2f} (Current: {curr_h:.2f}m)")

            bpy.context.view_layer.update()


def standardize_ensemble_heights():
    """Ensures Sylvan spirits meet the 'Double Majesty' scale requirements."""
    print("ASSET_MANAGER: Normalizing Ensemble Heights...")
    coll = bpy.data.collections.get("6a.ASSETS")
    if not coll:
        print("ASSET_MANAGER WARNING: No 6a.ASSETS collection found for normalization.")
        return

    for obj in coll.objects:
        # Include characters with .Rig suffix OR characters that ARE armatures (Root_Guardian)
        is_spirit_rig = ".Rig" in obj.name or (obj.type == 'ARMATURE' and "Body" in obj.name)
        if not is_spirit_rig:
            continue

        # Prevent double-scaling if normalization was already applied
        if obj.get("normalized_height"):
             continue

        target = config.MAJESTIC_HEIGHT
        if "Sprite" in obj.name:
            target = config.SPRITE_HEIGHT
        if "Phoenix" in obj.name:
            target = config.PHEONIX_HEIGHT
        force_majestic_height(obj, target)
        obj["normalized_height"] = True


# ---------------------------------------------------------------------------
# ENVIRONMENT
# ---------------------------------------------------------------------------

def setup_production_environment():
    """Creates the wide chroma backdrop (fallback — normally done by chroma_green_setup)."""
    existing = bpy.data.objects.get(config.BACKDROP_NAME)
    if existing:
        bpy.data.objects.remove(existing, do_unlink=True)

    bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 20, 0))
    obj = bpy.context.active_object
    obj.name = config.BACKDROP_NAME
    obj.rotation_euler = (1.5708, 0, 0)

    mat = bpy.data.materials.new(name="Mat.Chroma")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = next((n for n in nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if bsdf:
        # Blender 5.0+ uses "Base Color"
        color_input = bsdf.inputs.get("Base Color") or bsdf.inputs[0]
        color_input.default_value = (0, 1, 0, 1)
    obj.data.materials.append(mat)
    return obj


# ---------------------------------------------------------------------------
# MASTER ASSEMBLY
# ---------------------------------------------------------------------------

def generate_full_scene_v6():
    """Master production assembly for Scene 6."""
    start_t = time.time()
    try:
        # 0. Clean scene initialization — absolute first step
        SylvanEnsembleManager().ensure_clean_slate()

        director = SylvanDirector()

        # 1. Base structure (chroma backdrop + world)
        backdrop = setup_chroma_green_backdrop()
        print(f"ENV: Backdrop '{backdrop.name if backdrop else 'FAILED'}' restored from v5 logic.")

        # Pipeline Markers for Tests
        env_coll = bpy.data.collections.get("6b.ENVIRONMENT")
        if not env_coll:
            env_coll = bpy.data.collections.new("6b.ENVIRONMENT")
            bpy.context.scene.collection.children.link(env_coll)

        if backdrop and backdrop.name not in env_coll.objects:
            try:
                env_coll.objects.link(backdrop)
                # Also link other backdrop parts if they exist
                for name in ["ChromaBackdrop_OTS1", "ChromaBackdrop_OTS2"]:
                     bo = bpy.data.objects.get(name)
                     if bo and bo.name not in env_coll.objects:
                         env_coll.objects.link(bo)
            except: pass

        # 2. Ensemble & protagonists
        asset_manager = SylvanEnsembleManager()
        asset_manager.link_protagonists()

        # Try FBX import first (Phase B requirement), fall back to blend linking if not found
        asset_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets")
        use_fbx = any(f.endswith(".fbx") for f in os.listdir(asset_dir)) if os.path.exists(asset_dir) else False

        characters = {}   # extend here when protagonist rigs are available
        scene_logic = DialogueSceneV6(characters, [])
        scene_logic.setup_scene(use_fbx=use_fbx)

        # 3. Height normalization (apply scale before cinematic keyframing)
        standardize_ensemble_heights()

        # 4. Cinematic direction
        director.position_protagonists()
        director.compose_ensemble()
        director.setup_cinematics()

        print(f"SUCCESS: Scene 6 assembled in {time.time() - start_t:.2f}s")

    except Exception as e:
        import traceback
        print(f"CRITICAL: Assembly failed: {e}")
        traceback.print_exc()


if __name__ == "__main__":
    generate_full_scene_v6()

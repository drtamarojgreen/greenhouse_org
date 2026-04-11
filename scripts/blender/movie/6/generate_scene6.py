import bpy
import os
import time
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
    """World-space height normalization for a single rig/mesh ensemble."""
    from animation_library_v6 import get_bone
    import mathutils
    import statistics

    # Find the Mesh child
    mesh = next((o for o in bpy.data.objects if o.parent == rig or rig.name.replace(".Rig", ".Body") == o.name), None)

    # Pre-reset scale if it is extreme to ensure stable height calculation
    if rig.scale.x > 100 or rig.scale.x < 0.01:
        rig.scale = (1, 1, 1)

    bpy.context.view_layer.update()

    if mesh and mesh.type == 'MESH':
        # Use evaluated mesh with shard filtering for accurate height
        dg = bpy.context.evaluated_depsgraph_get()
        eval_obj = mesh.evaluated_get(dg)
        eval_mesh = eval_obj.data

        # 1. Collect all world Z coordinates
        all_z = [(eval_obj.matrix_world @ v.co).z for v in eval_mesh.vertices]
        if not all_z:
            curr_h = 0
        else:
            # 2. Outlier Detection: Use median to find the "core" cluster
            med_z = statistics.median(all_z)

            # 3. Filter vertices by spatial proximity and weight
            z_vals = []
            for v in eval_mesh.vertices:
                w_co_z = (eval_obj.matrix_world @ v.co).z
                # Ignore vertices more than 10m from median (filters floating shards)
                if abs(w_co_z - med_z) > 10.0:
                    continue

                if v.groups:
                    total_w = sum(g.weight for g in v.groups)
                    if total_w < 0.1:
                        continue

                z_vals.append(w_co_z)

            if z_vals:
                curr_h = max(z_vals) - min(z_vals)
            else:
                # Fallback to bound box
                bbox = [mesh.matrix_world @ mathutils.Vector(c) for c in mesh.bound_box]
                z_vals_bbox = [v.z for v in bbox]
                curr_h = max(z_vals_bbox) - min(z_vals_bbox)
    else:
        # Fallback to bone-based height if no mesh found or if mesh is same as rig
        head = get_bone(rig, "Head") or get_bone(rig, "Neck") or get_bone(rig, "top")
        foot = (get_bone(rig, "Foot.L")
                or get_bone(rig, "Foot.R")
                or get_bone(rig, "LeftFoot")
                or get_bone(rig, "Hips")
                or get_bone(rig, "bottom"))

        if head and foot:
            h_pos  = (rig.matrix_world @ head.head).z
            f_pos  = (rig.matrix_world @ foot.tail).z
            curr_h = abs(h_pos - f_pos)
        else:
            curr_h = 0

    if curr_h > 0.01:
        factor = target_h / curr_h

        # If factor is near 1.0, we're already normalized
        if 0.98 < factor < 1.02:
             return

        # Normalize Sibling Hierarchy: Rig and Mesh must be scaled simultaneously
        # because the Mesh is no longer a child of the Rig.
        rig.scale = tuple(s * factor for s in rig.scale)
        if mesh and mesh != rig:
             mesh.scale = tuple(s * factor for s in mesh.scale)
             print(f"ASSET_MANAGER: Normalized Sibling Ensemble {rig.name} (factor {factor:.2f}, height {curr_h:.2f}m)")
             print(f"  > Rig Scale: {rig.scale}")
             print(f"  > Mesh Scale: {mesh.scale}")
        else:
             print(f"ASSET_MANAGER: Scaled Rig {rig.name} by {factor:.2f} (Current: {curr_h:.2f}m)")
             print(f"  > Rig Scale: {rig.scale}")

        rig["normalized_height"] = True
        bpy.context.view_layer.update()


def standardize_ensemble_heights():
    """Ensures Sylvan spirits meet the 'Double Majesty' scale requirements."""
    print("ASSET_MANAGER: Normalizing Ensemble Heights...")
    coll = bpy.data.collections.get("SET.SPIRITS.6a")
    if not coll:
        print("ASSET_MANAGER WARNING: No SET.SPIRITS.6a collection found for normalization.")
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

        # Tag rig to prevent re-normalization in this pass
        obj["normalized_height"] = True


# ---------------------------------------------------------------------------
# ENVIRONMENT
# ---------------------------------------------------------------------------

def setup_production_environment():
    """Creates the wide chroma backdrop (fallback — normally done by chroma_green_setup)."""
    existing = bpy.data.objects.get(config.BACKDROP_NAME)
    if existing:
        bpy.data.objects.remove(existing, do_unlink=True)

    bpy.ops.mesh.primitive_plane_add(size=1000, location=(0, 20, 0))
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
        env_coll = bpy.data.collections.get("ENV.CHROMA.6b")
        if not env_coll:
            env_coll = bpy.data.collections.new("ENV.CHROMA.6b")
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

        # 3. Height normalization (apply scale BEFORE keyframing in compose_ensemble)
        standardize_ensemble_heights()

        # 4. Cinematic direction
        director.position_protagonists()
        director.compose_ensemble()
        director.setup_cinematics()

        # Final view layer update to sync all transforms
        bpy.context.view_layer.update()

        print(f"SUCCESS: Scene 6 assembled in {time.time() - start_t:.2f}s")

    except Exception as e:
        import traceback
        print(f"CRITICAL: Assembly failed: {e}")
        traceback.print_exc()


if __name__ == "__main__":
    generate_full_scene_v6()

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
    """World-space bone-based height normalization for a single rig."""
    from animation_library_v6 import get_bone

    head = get_bone(rig, "Head") or get_bone(rig, "Neck")
    foot = (get_bone(rig, "Foot.L")
            or get_bone(rig, "Foot.R")
            or get_bone(rig, "LeftFoot"))

    if head and foot:
        bpy.context.view_layer.update()
        h_pos  = (rig.matrix_world @ head.head).z
        f_pos  = (rig.matrix_world @ foot.tail).z
        curr_h = abs(h_pos - f_pos)
        if curr_h > 0.01:
            factor = target_h / curr_h
            rig.scale = tuple(s * factor for s in rig.scale)

            # Sync sibling mesh scale to avoid distortion in sibling hierarchy
            mesh_name = rig.name.replace(".Rig", ".Body").replace("_Rig", "_Body")
            mesh = bpy.data.objects.get(mesh_name)
            if mesh:
                mesh.scale = rig.scale

            bpy.context.view_layer.update()


def standardize_ensemble_heights():
    """Ensures Sylvan spirits meet the 'Double Majesty' scale requirements."""
    # Whitelist of base character names to avoid accidental scaling of environmental assets
    character_names = list(config.SPIRIT_ENSEMBLE.values()) + [config.CHAR_HERBACEOUS, config.CHAR_ARBOR]

    for obj in bpy.data.objects:
        # Only process objects that are explicitly part of the character rig ensemble
        is_ensemble_rig = any(obj.name.startswith(name) for name in character_names) and \
                          (".Rig" in obj.name or "_Rig" in obj.name)

        if not is_ensemble_rig:
            continue

        target = config.MAJESTIC_HEIGHT
        if "Sprite" in obj.name:
            target = config.SPRITE_HEIGHT
        if "Phoenix" in obj.name:
            target = config.PHEONIX_HEIGHT

        force_majestic_height(obj, target)


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
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0, 1, 0, 1)
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

        # 2. Ensemble & protagonists
        characters = {}   # extend here when protagonist rigs are available
        scene_logic = DialogueSceneV6(characters, [])
        scene_logic.setup_scene()

        # 3. Cinematic direction
        director.position_protagonists()
        director.compose_ensemble()
        director.setup_cinematics()

        # 4. Height normalization
        standardize_ensemble_heights()

        print(f"SUCCESS: Scene 6 assembled in {time.time() - start_t:.2f}s")

    except Exception as e:
        import traceback
        print(f"CRITICAL: Assembly failed: {e}")
        traceback.print_exc()


if __name__ == "__main__":
    generate_full_scene_v6()

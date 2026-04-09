import bpy
import os
import time
import config
from director_v6 import SylvanDirector
from dialogue_scene_v6 import DialogueSceneV6

def generate_full_scene_v6():
    """Master production assembly for Scene 6."""
    start_t = time.time()
    try:
        # 0. Clean Scene Initialization (Absolute First Step)
        from asset_manager_v6 import SylvanEnsembleManager
        SylvanEnsembleManager().ensure_clean_slate()
        
        director = SylvanDirector()
        
        # 1. Base Structure (Chroma & Floor)
        from chroma_green_setup import setup_chroma_green_backdrop
        backdrop = setup_chroma_green_backdrop()
        print(f"ENV: Backdrop {backdrop.name if backdrop else 'FAILED'} restored from v5 logic.")
        
        # 2. Ensemble & Protagonists
        # characters = {
        #     config.CHAR_HERBACEOUS: {"rig_name": config.CHAR_HERBACEOUS + ".Rig"},
        #     config.CHAR_ARBOR: {"rig_name": config.CHAR_ARBOR + ".Rig"}
        # }
        characters = {} 
        scene_logic = DialogueSceneV6(characters, [])
        scene_logic.setup_scene()
        
        # 3. Cinematic Direction
        director.position_protagonists()
        director.compose_ensemble()
        director.setup_cinematics()
        
        # 4. Final Height Normalization (DISABLED per user request)
        # standardize_ensemble_heights()
        
        print(f"SUCCESS: Scene 6 Production assembled in {time.time() - start_t:.2f}s")
        
    except Exception as e:
        print(f"CRITICAL: Assembly failed: {str(e)}")
        import traceback
        traceback.print_exc()

def setup_production_environment():
    """Creates the wide chroma backdrop."""
    if config.BACKDROP_NAME in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects[config.BACKDROP_NAME], do_unlink=True)
    
    bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 20, 0))
    obj = bpy.context.active_object
    obj.name = config.BACKDROP_NAME
    obj.rotation_euler = (1.5708, 0, 0)
    
    mat = bpy.data.materials.new(name="Mat.Chroma")
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0, 1, 0, 1)
    obj.data.materials.append(mat)

def standardize_ensemble_heights():
    """Ensures Sylvan spirits meet the 'Double Majesty' scale requirements."""
    from director_v6 import SylvanDirector
    from asset_manager_v6 import SylvanEnsembleManager
    # Basic world height verification loop
    for obj in bpy.data.objects:
        if ".Rig" in obj.name:
            target = config.MAJESTIC_HEIGHT
            if "Sprite" in obj.name: target = config.SPRITE_HEIGHT
            if "Phoenix" in obj.name: target = config.PHEONIX_HEIGHT
            
            from generate_scene6 import force_majestic_height
            force_majestic_height(obj, target)

def force_majestic_height(rig, target_h):
    """World-space bone-based height normalization."""
    # Note: Imported from legacy for backward compatibility during refactor
    from animation_library_v6 import get_bone
    head = get_bone(rig, "Head") or get_bone(rig, "Neck")
    foot = get_bone(rig, "Foot.L") or get_bone(rig, "Foot.R") or get_bone(rig, "LeftFoot")
    
    if head and foot:
        bpy.context.view_layer.update()
        h_pos = rig.matrix_world @ head.head
        f_pos = rig.matrix_world @ foot.tail
        curr_h = abs(h_pos.z - f_pos.z)
        if curr_h > 0.01:
            rig.scale *= (target_h / curr_h)

if __name__ == "__main__":
    generate_full_scene_v6()

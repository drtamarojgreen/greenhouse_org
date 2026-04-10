import bpy
import os
import sys
import mathutils

# Ensure movie root and v6 are in path
V6_DIR = os.path.dirname(os.path.abspath(__file__))
MOVIE_ROOT = os.path.dirname(V6_DIR)
if V6_DIR not in sys.path: sys.path.append(V6_DIR)
if MOVIE_ROOT not in sys.path: sys.path.append(MOVIE_ROOT)

import config
from animation_library_v6 import get_bone
from style_utilities.engine_operations import update_view_layer

def run_production_audit():
    """Performs a comprehensive audit of the Scene 6 production environment."""
    print("\n" + "="*120)
    print(f"PRODUCTION AUDIT: Scene 6 Ensemble Integrity")
    print("="*120)

    # 1. Collection Audit
    spirit_coll = bpy.data.collections.get("SET.SPIRITS")
    if not spirit_coll:
        print("CRITICAL: Collection 'SET.SPIRITS' is missing!")
        return
    else:
        print(f"COLLECTION: 'SET.SPIRITS' verified ({len(spirit_coll.objects)} objects)")

    # 2. Detailed Ensemble Table
    print("\n" + "-"*145)
    print(f"{'ARTISTIC NAME':<20} | {'BODY MESH':<15} | {'RIG NAME':<15} | {'BONES':<6} | {'ANIM':<10} | {'HEIGHT':<6} | {'LOC (X,Y,Z)':<20} | {'TEX'}")
    print("-" * 145)
    
    # Audit Sylvan spirits
    for art_name in config.SPIRIT_ENSEMBLE.values():
        body = bpy.data.objects.get(f"{art_name}.Body")
        rig = bpy.data.objects.get(f"{art_name}.Rig")
        
        # Rigging Detail
        bone_count = len(rig.pose.bones) if rig else 0
        anim_status = "NONE"
        if rig and rig.animation_data and rig.animation_data.action:
            anim_status = "ACTIVE"
        
        height = 0
        if rig:
            # Multi-Fallback bone search for diverse skeletons
            head_bones = ["Head", "Neck", "Spine2", "top", "wing"]
            foot_bones = ["Foot.L", "Foot.R", "Hips", "Tail", "bottom"]
            
            h_bone = None
            for bname in head_bones:
                h_bone = get_bone(rig, bname)
                if h_bone: break
                
            f_bone = None
            for bname in foot_bones:
                f_bone = get_bone(rig, bname)
                if f_bone: break
                
            if h_bone and f_bone:
                update_view_layer()
                height = abs((rig.matrix_world @ h_bone.head).z - (rig.matrix_world @ f_bone.tail).z)
        
        # Growth Audit (F1 vs F2)
        bpy.context.scene.frame_set(1)
        update_view_layer()
        h1 = height # Use detected height as baseline
        
        bpy.context.scene.frame_set(2)
        update_view_layer()
        h2 = 0
        if rig and h_bone and f_bone:
             h2 = abs((rig.matrix_world @ h_bone.head).z - (rig.matrix_world @ f_bone.tail).z)
        
        growth_status = f"{h1:.1f} -> {h2:.1f}" if h1 > 0 else "N/A"
        vis = "HIDDEN" if (body and body.hide_render) else "VISIBLE"
        
        # Ensure correct pipe alignment
        b_st = "OK" if body else "MISS"
        r_st = "OK" if rig else "MISS"
        loc = body.matrix_world.to_translation() if body else mathutils.Vector((0,0,0))
        loc_str = f"{loc.x:.1f},{loc.y:.1f},{loc.z:.1f}"
        
        print(f"{art_name:<15} | {b_st:<10} | {r_st:<10} | {bone_count:<6} | {anim_status:<10} | {growth_status:<15} | {loc_str:<15} | {vis}")
    
    # Audit Protagonists
    for name in [config.CHAR_HERBACEOUS, config.CHAR_ARBOR]:
        body = bpy.data.objects.get(name + ".Body") or bpy.data.objects.get(name)
        if body:
             print(f"{name:<20} | FOUND                | {'N/A':<20} | {'N/A':<8} | {body.location.y:<8.2f} | PROTAG")

    print("-" * 115)
    
    # 3. Cinematic Audit
    cam = bpy.data.objects.get(config.CAMERA_NAME)
    print(f"\nCINEMATICS: Camera '{config.CAMERA_NAME}' Status: {'READY' if cam else 'MISSING'}")
    if cam:
        print(f"            Active Camera: {'YES' if bpy.context.scene.camera == cam else 'NO'}")
    
    print("="*120 + "\n")

if __name__ == "__main__":
    print("\n[AUDIT] Initializing Clean Production Assembly...")
    from generate_scene6 import generate_full_scene_v6
    
    # 1. CLEAN ASSEMBLY
    bpy.ops.wm.read_factory_settings(use_empty=True)
    generate_full_scene_v6()
    update_view_layer()
    
    # 2. RUN AUDIT
    run_production_audit()

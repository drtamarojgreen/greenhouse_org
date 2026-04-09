import bpy
import os
import sys

# Ensure v6 is in path
V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if V6_DIR not in sys.path: sys.path.append(V6_DIR)

import config
from generate_scene6 import generate_full_scene_v6

def audit_scene():
    print("\n" + "="*80)
    print("SCENE 6 PRODUCTION AUDIT")
    print("="*80)
    
    # 1. Assemble Scene
    generate_full_scene_v6()
    
    # 2. Audit Objects
    print(f"\n{'OBJECT NAME':<30} | {'TYPE':<10} | {'HIDDEN':<8} | {'MATERIAL'}")
    print("-" * 80)
    for obj in bpy.data.objects:
        mat_info = obj.data.materials[0].name if hasattr(obj.data, "materials") and obj.data.materials else "NONE"
        print(f"{obj.name:<30} | {obj.type:<10} | {obj.hide_render:<8} | {mat_info}")
        
        # Shader Audit for Backdrops
        if "Backdrop" in obj.name:
            if obj.data.materials:
                mat = obj.data.materials[0]
                if mat.use_nodes:
                    tex_nodes = [n for n in mat.node_tree.nodes if n.type == 'TEX_IMAGE']
                    print(f"  > Backdrop Nodes: {[n.type for n in mat.node_tree.nodes]}")
                    print(f"  > Texture Images: {[n.image.name if n.image else 'EMPTY' for n in tex_nodes]}")

    # 3. Audit Cameras
    print(f"\nACTIVE CAMERA: {bpy.context.scene.camera.name if bpy.context.scene.camera else '!!!! MISSING !!!!'}")
    all_cams = [o.name for o in bpy.data.objects if o.type == 'CAMERA']
    print(f"ALL CAMERAS: {all_cams}")

    # 4. Audit World
    world = bpy.context.scene.world
    print(f"\nWORLD: {world.name if world else 'NONE'}")
    if world and world.use_nodes:
         print(f"  > World Nodes: {[n.type for n in world.node_tree.nodes]}")

    print("\n" + "="*80 + "\n")

if __name__ == "__main__":
    audit_scene()

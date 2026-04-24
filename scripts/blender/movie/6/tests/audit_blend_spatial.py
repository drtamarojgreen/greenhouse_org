import bpy
import os
import mathutils

def audit_blend_spatial_links():
    """
    Scans the master blend file and prints a table of Rigs, Meshes,
    Locations, and Textures.
    """
    blend_path = "/home/tamarojgreen/development/LLM/greenhouse_org/scripts/blender/movie/6/MHD2_optimized.blend"
    
    if not bpy.ops.wm.open_mainfile(filepath=blend_path):
        print(f"FAILED: Cannot open {blend_path}")
        return

    print(f"\n{'Armature':<20} | {'Mesh Object':<30} | {'Location (XYZ)':<30} | {'Linked Texture'}")
    print("-" * 120)
    
    for rig in [o for o in bpy.data.objects if o.type == 'ARMATURE']:
        # Find meshes parented to this rig
        for mesh in [c for c in rig.children_recursive if c.type == 'MESH']:
            # Texture
            img_name = "None"
            if mesh.data.materials:
                mat = mesh.data.materials[0]
                if mat and mat.use_nodes:
                    for node in mat.node_tree.nodes:
                        if node.type == 'TEX_IMAGE' and node.image:
                            img_name = node.image.name
            
            loc = tuple(round(c, 1) for c in rig.matrix_world.translation)
            print(f"{rig.name:<20} | {mesh.name:<30} | {str(loc):<30} | {img_name}")

if __name__ == "__main__":
    audit_blend_spatial_links()

import bpy
import bmesh
import math
import mathutils
import os
import sys

# Standardize path injection for animation_library_v6 access
V6_DIR = os.path.dirname(os.path.abspath(__file__))
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)

def get_normalization_metrics(obj):
    """Calculates height and ground using world-space vertex data for Rig or Mesh."""
    if not obj: return None
    
    meshes = []
    if obj.type == 'ARMATURE':
        meshes = [c for c in obj.children_recursive if c.type == 'MESH' and not c.hide_render]
    elif obj.type == 'MESH':
        meshes = [obj]
    
    if not meshes: return None
    
    all_z = []
    for m in meshes:
        mw = m.matrix_world
        for v in m.data.vertices:
            all_z.append((mw @ v.co).z)
            
    if not all_z: return None
    
    all_z.sort()
    min_z, max_z = all_z[0], all_z[-1]
    
    # Percentiles (1% to 99%) to ignore outliers
    p01_idx = int(len(all_z) * 0.01)
    p99_idx = int(len(all_z) * 0.99)
    
    ground_z = all_z[p01_idx]
    top_z = all_z[p99_idx]
    height = top_z - ground_z
    
    return {
        "height": max(0.1, height),
        "ground_z": ground_z,
        "top_z": top_z,
        "absolute_min": min_z
    }

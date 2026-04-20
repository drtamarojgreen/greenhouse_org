import bpy
import bmesh
import math
import mathutils
import os
import sys

# Standardize path injection for animation_library_v6 access
V6_DIR = os.path.dirname(os.path.abspath(__file__))
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)

try:
    import animation_library_v6
except ImportError:
    from . import animation_library_v6

def execute_balanced_culling(rig, config):
    """
    Identifies 'spidery' splinters by comparing the population of the first vs. last distance bins.
    Systematically deletes farthest vertices until the 10th bin matches the target bin size.
    """
    if not rig or rig.type != 'ARMATURE':
        return

    meshes = [c for c in rig.children_recursive if c.type == 'MESH']
    print(f"   [Normalization] Balanced Culling: {rig.name}")
    
    total_removed = 0
    irw = rig.matrix_world.inverted()

    for mesh in meshes:
        mw = mesh.matrix_world
        v_data = [] # (index, distance)
        for v in mesh.data.vertices:
            local_pos = irw @ (mw @ v.co)
            v_data.append((v.index, local_pos.length))
        
        if not v_data: continue
        
        max_d = max(d for i, d in v_data)
        min_d = min(d for i, d in v_data)
        bin_width = (max_d - min_d) / 10 if max_d > min_d else 1.0
        
        target_bin_idx = getattr(config, "CULLING_TARGET_BIN", 0)
        bin0_threshold = min_d + bin_width
        bin0_count = sum(1 for v in v_data if v[1] < bin0_threshold)
        
        bin9_threshold = min_d + (9 * bin_width)
        bin9_data = [v for v in v_data if v[1] >= bin9_threshold]
        
        target_count = bin0_count
        to_delete_total = len(bin9_data) - target_count
        
        if to_delete_total <= 0:
            continue
            
        print(f"      - {mesh.name}: Pruning {to_delete_total} vertices to balance distribution...")
        
        bin9_data.sort(key=lambda x: x[1], reverse=True)
        target_indices = {v[0] for v in bin9_data[:to_delete_total]}
        
        bm = bmesh.new()
        bm.from_mesh(mesh.data)
        bm.verts.ensure_lookup_table()
        
        verts_to_remove = []
        for i in target_indices:
            if i < len(bm.verts):
                verts_to_remove.append(bm.verts[i])
                total_removed += 1

        bmesh.ops.delete(bm, geom=verts_to_remove, context='VERTS')
        
        bm.to_mesh(mesh.data)
        bm.free()
        mesh.data.update()
        
    if total_removed > 0:
        print(f"      [X] Balanced Culling complete. Total {total_removed} vertices removed from {rig.name}")

def execute_density_origin_reset(rig):
    """
    Parent-First Origin Reset:
    1. Bind meshes to rig root immediately.
    2. Reset all local mesh transforms and parent inverses to zero.
    3. Finds 'True Ground' and moves the Rig to world 0.
    """
    if not rig or rig.type != 'ARMATURE':
        return

    meshes = [c for c in rig.children_recursive if c.type == 'MESH']
    
    rig.location = (0, 0, 0)
    rig.rotation_euler = (0, 0, 0)
    rig.scale = (1, 1, 1)
    bpy.context.view_layer.update()

    for m in meshes:
        m.parent = rig
        m.matrix_parent_inverse = mathutils.Matrix.Identity(4)
        m.location = (0, 0, 0)
        m.rotation_euler = (0, 0, 0)
        m.scale = (1, 1, 1)
        m.delta_location = (0, 0, 0)
        m.delta_rotation_euler = (0, 0, 0)
        m.delta_scale = (1, 1, 1)

    bpy.context.view_layer.update()

    metrics = get_normalization_metrics(rig, strategy='DENSITY')
    if metrics:
        rig.location.z -= metrics['ground_z']
        print(f"   [Normalization] {rig.name}: Origin snapped to True Ground (Z={metrics['ground_z']:.2f}m)")

    bpy.context.view_layer.update()

# --- HEIGHT MEASUREMENT STRATEGIES ---

def measure_height_bones(rig):
    """Method 1: Bone-to-Bone distance (Head to Foot) + 15% buffer."""
    if rig.type != 'ARMATURE': return 0
    head = animation_library_v6.get_bone(rig, "Head")
    foot_l = animation_library_v6.get_bone(rig, "Foot.L")
    foot_r = animation_library_v6.get_bone(rig, "Foot.R")

    if head and (foot_l or foot_r):
        mw = rig.matrix_world
        h_z = (mw @ head.head).z
        f_z = (mw @ foot_l.head).z if foot_l else (mw @ foot_r.head).z
        return abs(h_z - f_z) * 1.15
    return 0

def measure_height_percentile(rig):
    """Method 2: 99th Percentile Bounding Box distance."""
    meshes = [c for c in rig.children_recursive if c.type == 'MESH']
    all_z = []
    for m in meshes:
        mw = m.matrix_world
        for v in m.data.vertices:
            all_z.append((mw @ v.co).z)
    
    if not all_z: return 0
    all_z.sort()
    idx_min = int(len(all_z) * 0.005)
    idx_max = int(len(all_z) * 0.995)
    return all_z[idx_max] - all_z[idx_min]

def measure_height_density(rig):
    """Method 3: Histogram density clusters (Ignores spidery outliers)."""
    metrics = get_normalization_metrics(rig, strategy='DENSITY')
    return metrics['height'] if metrics else 0

def get_normalization_metrics(rig, strategy='DENSITY'):
    """Calculates True Height and True Ground Z using selected strategy."""
    if not rig: return None
    
    meshes = [c for c in rig.children_recursive if c.type == 'MESH']
    if not meshes: return None
    
    all_z = []
    for m in meshes:
        mw = m.matrix_world
        for v in m.data.vertices:
            all_z.append((mw @ v.co).z)
            
    if not all_z: return None
    
    min_z, max_z = min(all_z), max(all_z)
    span = max_z - min_z
    num_bins = 20 # Increased resolution for better density detection
    bin_width = span / num_bins if span > 0 else 1.0
    
    bins = [0] * num_bins
    for z in all_z:
        idx = min(num_bins - 1, int((z - min_z) / bin_width)) if bin_width > 0 else 0
        bins[idx] += 1
        
    # Density Ground/Top Detection
    true_ground_z = min_z
    true_top_z = max_z
    threshold_count = len(all_z) * 0.015
    
    for i, count in enumerate(bins):
        if count > threshold_count:
            true_ground_z = min_z + (i * bin_width)
            break
            
    for i in range(num_bins - 1, -1, -1):
        if bins[i] > threshold_count:
            true_top_z = min_z + ((i + 1) * bin_width)
            break
            
    height = true_top_z - true_ground_z
    
    # Overrides based on strategy
    if strategy == 'BONE':
        height = measure_height_bones(rig)
    elif strategy == 'PERCENTILE':
        height = measure_height_percentile(rig)
        
    return {
        "height": max(0.1, height),
        "ground_z": true_ground_z,
        "top_z": true_top_z
    }

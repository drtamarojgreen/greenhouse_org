import bpy
import os
import sys
import math
import mathutils

# 1. Setup Environment Paths
V6_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if V6_DIR not in sys.path: sys.path.insert(0, V6_DIR)

import config
import asset_manager_v6

def get_character_metrics(rig_name):
    """Calculates height, radius, vertex count, and distance histogram for a character rig."""
    rig = bpy.data.objects.get(rig_name)
    if not rig: return None

    # Find all meshes under this rig
    meshes = [c for c in rig.children_recursive if c.type == 'MESH']
    if not meshes: return None

    all_distances = []
    total_verts = 0
    total_mesh_verts = sum(len(m.data.vertices) for m in meshes)
    
    # Bounding variables
    min_x, max_x = 9999.0, -9999.0
    min_y, max_y = 9999.0, -9999.0
    min_z, max_z = 9999.0, -9999.0
    
    max_d = -1.0
    farthest_v_wco = mathutils.Vector((0,0,0))
    max_radius_sq = 0.0

    processed_count = 0
    last_report_count = 0
    
    imw = rig.matrix_world.inverted()

    for mesh in meshes:
        mw = mesh.matrix_world
        verts = mesh.data.vertices
        total_verts += len(verts)
        
        for v in verts:
            w_co = mw @ v.co
            min_x = min(min_x, w_co.x)
            max_x = max(max_x, w_co.x)
            min_y = min(min_y, w_co.y)
            max_y = max(max_y, w_co.y)
            min_z = min(min_z, w_co.z)
            max_z = max(max_z, w_co.z)
            
            # Local distance analysis
            local_pos = imw @ w_co
            dist = local_pos.length
            all_distances.append(dist)
            
            if dist > max_d:
                max_d = dist
                farthest_v_wco = w_co.copy()
            
            # Radius (XY span from rig origin)
            # Use local position so we ignore world translation
            r_sq = local_pos.x**2 + local_pos.y**2
            max_radius_sq = max(max_radius_sq, r_sq)

            processed_count += 1
            if processed_count - last_report_count >= 5000:
                percent = (processed_count / total_mesh_verts) * 100
                bar = "#" * int(percent / 5) + "-" * (20 - int(percent / 5))
                print(f"      [{bar}] {percent:5.1f}% | Processed: {processed_count:,}/{total_mesh_verts:,}", end="\r")
                last_report_count = processed_count

    height = max(0, max_z - min_z)
    radius = math.sqrt(max_radius_sq)
    origin = rig.location.copy()

    # 2. Histogram Analysis
    if not all_distances: return None
    min_d = min(all_distances)
    num_bins = 10
    bin_width = (max_d - min_d) / num_bins if max_d > min_d else 1.0
    bins = [0] * num_bins
    for d in all_distances:
        idx = min(num_bins - 1, int((d - min_d) / bin_width)) if bin_width > 0 else 0
        bins[idx] += 1

    farthest_bin_idx = next((i for i in range(num_bins - 1, -1, -1) if bins[i] > 0), 0)
    anomalies = bins[farthest_bin_idx]
    anomaly_dist = min_d + (farthest_bin_idx * bin_width)

    return {
        "height": height,
        "radius": radius,
        "origin": origin,
        "farthest_v": farthest_v_wco,
        "verts": total_verts,
        "max_dist": max_d,
        "anomaly_count": anomalies,
        "anomaly_dist": anomaly_dist,
        "bins": bins
    }

def balanced_stat_culling(rig_name):
    """Systematically deletes farthest vertices until the 10th bin matches the 1st bin's size."""
    import bmesh
    rig = bpy.data.objects.get(rig_name)
    if not rig: return
    
    meshes = [c for c in rig.children_recursive if c.type == 'MESH']
    print(f"   [Culling] Sanitizing {rig_name}...")
    
    for mesh in meshes:
        # 1. Initial Histogram
        mw = mesh.matrix_world
        irw = rig.matrix_world.inverted()
        
        v_data = [] # (index, distance)
        for v in mesh.data.vertices:
            local_pos = irw @ (mw @ v.co)
            v_data.append((v.index, local_pos.length))
        
        if not v_data: continue
        
        max_d = max(d for i, d in v_data)
        min_d = min(d for i, d in v_data)
        bin_width = (max_d - min_d) / 10 if max_d > min_d else 1.0
        
        bin0_count = sum(1 for v in v_data if v[1] < (min_d + bin_width))
        bin9_threshold = min_d + (9 * bin_width)
        bin9_data = [v for v in v_data if v[1] >= bin9_threshold]
        
        target_count = bin0_count
        to_delete_total = len(bin9_data) - target_count
        
        if to_delete_total <= 0:
            continue
            
        print(f"      - {mesh.name}: Bin0={bin0_count}, Bin9={len(bin9_data)}. Culling {to_delete_total} vertices...")
        
        # 2. Iterative deletion with progress bar
        bin9_data.sort(key=lambda x: x[1], reverse=True)
        target_indices = {v[0] for v in bin9_data[:to_delete_total]}
        
        bm = bmesh.new()
        bm.from_mesh(mesh.data)
        bm.verts.ensure_lookup_table()
        
        processed = 0
        verts_to_remove = []
        for i in target_indices:
            if i < len(bm.verts):
                verts_to_remove.append(bm.verts[i])
                processed += 1
                if processed % 500 == 0:
                    percent = (processed / to_delete_total) * 100
                    bar = "#" * int(percent / 5) + "-" * (20 - int(percent / 5))
                    print(f"         [{bar}] {percent:5.1f}% | Culling: {processed:,}/{to_delete_total:,}", end="\r")

        bmesh.ops.delete(bm, geom=verts_to_remove, context='VERTS')
        print(f"\n         [####################] 100.0% | Complete: {processed:,} vertices removed")
        
        bm.to_mesh(mesh.data)
        bm.free()
        mesh.data.update()
        
    print(f"      [X] Balanced Culling complete for {rig_name}")

def experimental_origin_reset(rig_name):
    """Absolute Reset: Snaps 'True Ground' (dense feet) to rig root and burns in transforms."""
    rig = bpy.data.objects.get(rig_name)
    if not rig: return
    
    meshes = [c for c in rig.children_recursive if c.type == 'MESH']
    
    # 1. Prepare Rig
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    rig.location = (0, 0, 0)
    rig.rotation_euler = (0, 0, 0)
    rig.scale = (1, 1, 1)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    rig.select_set(False)

    for m in meshes:
        bpy.context.view_layer.objects.active = m
        m.select_set(True)
        
        # 2. Mirror GUI: Clear Parent & Reset Origin
        # This mirrors 'Object > Parent > Clear and Keep Transformation'
        mw = m.matrix_world.copy()
        m.parent = None
        m.matrix_world = mw
        
        # 3. Find Density-Based Ground (Ignore splinters)
        verts = m.data.vertices
        if not verts: continue
        all_z = [ (mw @ v.co).z for v in verts ]
        min_z, max_z = min(all_z), max(all_z)
        span = max_z - min_z
        num_bins = 10
        bin_width = span / num_bins if span > 0 else 1.0
        
        bins = [0] * num_bins
        for z in all_z:
            idx = min(num_bins - 1, int((z - min_z) / bin_width))
            bins[idx] += 1
            
        # Target: The first bin with > 2% density (the character base)
        true_ground_z = min_z
        for i, count in enumerate(bins):
            if count > (len(verts) * 0.02):
                true_ground_z = min_z + (i * bin_width)
                break

        # 4. Snap and Apply (The "Fix Origin" equivalent)
        # Move mesh so the 'True Ground' is at Z=0
        m.location.z -= true_ground_z
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        
        # Set origin to the newly defined (0,0,0) world point
        bpy.context.scene.cursor.location = (0, 0, 0)
        bpy.ops.object.origin_set(type='ORIGIN_CURSOR')
        
        # 5. Re-Parent
        m.parent = rig
        m.matrix_parent_inverse = mathutils.Matrix.Identity(4)
        m.select_set(False)

    bpy.context.view_layer.update()
    print(f"      [!] True Ground Reset complete for {rig_name}")

def run_character_size_audit():
    print("\n" + "="*80)
    print("      CHARACTER GEOMETRY & NORMALIZATION DIAGNOSTIC REPORT")
    print("="*80)
    
    manager = asset_manager_v6.SylvanEnsembleManager()
    manager.ensure_clean_slate()
    manager.link_ensemble()
    manager.link_protagonists()
    bpy.context.view_layer.update()

    rigs = [o for o in bpy.data.objects if o.type == 'ARMATURE']
    results = {}

    print(f"\nPhase 1: Pre-Normalization Audit ({len(rigs)} characters)")
    for rig in rigs:
        key = rig.get("source_name") or rig.name
        metrics = get_character_metrics(rig.name)
        if metrics:
            results[key] = {"before": metrics, "final_name": rig.name}

    print("\nPhase 2: Normalizing Assets (Baseline)...")
    #manager.renormalize_objects()
    bpy.context.view_layer.update()

    print("\nPhase 3: Post-Normalization Audit")
    for rig in [o for o in bpy.data.objects if o.type == 'ARMATURE']:
        key = rig.get("source_name") or rig.name
        if key in results:
            metrics = get_character_metrics(rig.name)
            if metrics:
                results[key]["after"] = metrics
    
    print("\nPhase 4: Balanced Statistical Culling experiment")
    for rig in [o for o in bpy.data.objects if o.type == 'ARMATURE']:
        key = rig.get("source_name") or rig.name
        if key in results:
            balanced_stat_culling(rig.name)
    
    print("\nPhase 5: Experimental Absolute Origin Reset")
    for rig in [o for o in bpy.data.objects if o.type == 'ARMATURE']:
        key = rig.get("source_name") or rig.name
        if key in results:
            experimental_origin_reset(rig.name)
    
    print("\nPhase 6: Final Re-Normalization Audit")
    #manager.renormalize_objects()
    bpy.context.view_layer.update()
    
    for rig in [o for o in bpy.data.objects if o.type == 'ARMATURE']:
        key = rig.get("source_name") or rig.name
        if key in results:
            metrics = get_character_metrics(rig.name)
            if metrics:
                results[key]["culled"] = metrics

    # --- FINAL TABULAR REPORT ---
    print("\n" + "-"*175)
    print(f"{'Character':<22} | {'H(Reset)':<8} | {'R(Pre)':<8} | {'R(Reset)':<8} | {'Origin (Reset)':<20} | {'Farthest Vertex (Reset)':<25} | {'MaxDist'}")
    print("-"*175)
    
    for key in sorted(results.keys()):
        data = results[key]
        if "before" not in data or "after" not in data or "culled" not in data: continue
        
        b = data["before"]
        a = data["after"]
        c = data["culled"]
        name = data["final_name"]
        
        ori = c['origin']
        origin_str = f"({ori.x:.1f},{ori.y:.1f},{ori.z:.1f})"
        
        fv = c['farthest_v']
        fv_str = f"[{fv.x:.1f}, {fv.y:.1f}, {fv.z:.1f}]"
        
        print(f"{name[:22]:<22} | {c['height']:<8.2f} | {b['radius']:<8.2f} | {c['radius']:<8.2f} | {origin_str:<20} | {fv_str:<25} | {c['max_dist']:<10.2f}")
        
        if c['max_dist'] > 10.0:
             bin_str = " ".join([f"[{v}]" for v in c['bins']])
             print(f"       Bins: {bin_str}")

    print("-"*175)
    print("Audit Complete.\n")

if __name__ == "__main__":
    run_character_size_audit()

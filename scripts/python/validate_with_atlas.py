
import os
import numpy as np
import nrrd
import json

def validate():
    # 1. Load Data
    atlas_path = "data/atlas/annotation_25.nrrd"
    vertices_path = "data/atlas/vertices.npy"
    matrix_path = "data/atlas/alignment_matrix.npy"
    graph_path = "data/atlas/structure_graph.json"
    
    print("Loading data...")
    if not os.path.exists(vertices_path):
        print("Vertices not found. Run export_mesh_info.py via Blender first.")
        return

    atlas, header = nrrd.read(atlas_path)
    vertices = np.load(vertices_path) # (N, 3)
    matrix = np.load(matrix_path)
    
    with open(graph_path, 'r') as f:
        graph = json.load(f)
        
    print(f"Loaded Atlas Shape: {atlas.shape}")
    print(f"Loaded Vertices: {vertices.shape}")
    
    # 2. Transform Vertices to Atlas Space
    # Apply affine transform
    # V_atlas = M @ V_mesh
    # Homogeneous coordinates
    ones = np.ones((vertices.shape[0], 1))
    vertices_h = np.hstack([vertices, ones])
    
    # Transpose for multiplication (4, N)
    vertices_transformed_h = matrix @ vertices_h.T 
    vertices_transformed = vertices_transformed_h[:3, :].T # (N, 3)
    
    print(f"Transformed Vertices Sample:\n{vertices_transformed[:3]}")
    
    # 3. Convert to Voxel Coordinates
    # Atlas is 25um (0.025 mm) isotropic.
    # Coordinates in matrix are in mm (based on align_mesh logic).
    # Voxel = Coord_mm / 0.025
    
    spacing = 0.025
    voxels = vertices_transformed / spacing
    voxels = np.round(voxels).astype(int)
    
    print(f"Voxel Coords Sample:\n{voxels[:3]}")
    
    # 4. Sample Atlas
    # Check bounds
    D, H, W = atlas.shape # Note: check dimension order! nrrd.read output depends on header.
    # Usually: axis 0 is x, 1 is y, 2 is z.
    # But let's check bounds to be safe.
    
    valid_mask = (
        (voxels[:, 0] >= 0) & (voxels[:, 0] < D) &
        (voxels[:, 1] >= 0) & (voxels[:, 1] < H) &
        (voxels[:, 2] >= 0) & (voxels[:, 2] < W)
    )
    
    valid_voxels = voxels[valid_mask]
    
    print(f"Vertices inside Atlas Bounds: {np.sum(valid_mask)} / {len(vertices)} ({np.mean(valid_mask)*100:.2f}%)")
    
    labels = np.zeros(len(vertices), dtype=int)
    labels[valid_mask] = atlas[valid_voxels[:, 0], valid_voxels[:, 1], valid_voxels[:, 2]]
    
    # 5. Analysis
    unique_labels, counts = np.unique(labels, return_counts=True)
    
    print(f"\n--- Validation Results ---")
    print(f"Total Unique Regions Hit: {len(unique_labels)}")
    
    # Helper to find name from ID
    # Flatten graph
    id_to_name = {}
    def flatten_graph(node):
        id_to_name[node['id']] = node['name']
        for child in node.get('children', []):
            flatten_graph(child)
    
    # The structure graph usually wraps the root in msg
    root = graph['msg'][0] if 'msg' in graph else graph
    if isinstance(root, list): root = root[0]
    flatten_graph(root)
    
    # Top 10 regions
    sorted_indices = np.argsort(-counts)
    print("\nTop 10 Regions:")
    for i in sorted_indices[:10]:
        lid = unique_labels[i]
        count = counts[i]
        name = id_to_name.get(lid, "Unknown/Background" if lid == 0 else f"ID {lid}")
        percent = count / len(vertices) * 100
        print(f"Region {lid} ({name}): {count} vertices ({percent:.2f}%)")
        
    # Save the generated Ground Truth Labels for ML training
    # This was the ultimate goal!
    output_labels_path = "scripts/python/labels.npy"
    # We might need to remap these IDs to the small set used (1,2,3,4) or train on full set.
    # For now, save raw atlas IDs.
    np.save(output_labels_path, labels)
    print(f"\nSaved generated labels to {output_labels_path}")

if __name__ == "__main__":
    validate()

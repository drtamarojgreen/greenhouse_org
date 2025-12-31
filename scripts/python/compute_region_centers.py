
import os
import numpy as np
import json

def compute_centers():
    # Paths
    labels_path = "scripts/python/labels.npy"
    vertices_path = "scripts/python/vertices.npy"
    map_path = "scripts/python/region_map.json"
    output_path = "data/atlas/region_centers.json"
    
    print("--- Computing Region Centers ---")
    
    if not os.path.exists(labels_path):
        print("Labels not found.")
        return

    # Load data
    labels = np.load(labels_path)
    vertices = np.load(vertices_path)
    
    with open(map_path, 'r') as f:
        region_map = json.load(f) # "ID_str": "Name"
        
    # Invert/Fix map keys to int
    id_to_name = {int(k): v for k, v in region_map.items()}
    
    # Compute centroids
    unique_ids = np.unique(labels)
    
    centers = {} # Name -> [x, y, z]
    
    for uid in unique_ids:
        if uid == 0: continue # Skip background
        
        mask = (labels == uid)
        points = vertices[mask]
        
        # Centroid
        centroid = points.mean(axis=0)
        
        name = id_to_name.get(uid, f"Region_{uid}")
        
        centers[name] = centroid.tolist()
        # Also store by ID str for easy lookup if needed
        centers[str(uid)] = centroid.tolist()
        
    print(f"Computed centers for {len(centers)//2} regions (stored by name and ID).")
    
    with open(output_path, 'w') as f:
        json.dump(centers, f, indent=2)
        
    print(f"Saved centers to {output_path}")

if __name__ == "__main__":
    compute_centers()

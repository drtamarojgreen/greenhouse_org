
import os
import json
import numpy as np
import nrrd

def prepare_data():
    # Paths
    raw_labels_path = "scripts/python/labels.npy"
    graph_path = "data/atlas/structure_graph.json"
    output_labels_path = "scripts/python/labels.npy" # Overwrite or separate? Let's use same name for train.py
    raw_backup_path = "scripts/python/labels_atlas_ids.npy"
    mapping_output_path = "scripts/python/region_map.json"
    
    # 1. Load Raw Labels
    if not os.path.exists(raw_labels_path):
        print(f"Error: {raw_labels_path} not found.")
        return

    raw_labels = np.load(raw_labels_path)
    print(f"Loaded {len(raw_labels)} raw labels.")

    # Generic lookup for names
    with open(graph_path, 'r') as f:
        graph = json.load(f)
    
    id_to_name = {}
    def flatten_graph(node):
        id_to_name[node['id']] = node['name']
        for child in node.get('children', []):
            flatten_graph(child)
    root = graph['msg'][0] if 'msg' in graph else graph
    if isinstance(root, list): root = root[0]
    flatten_graph(root)

    # 2. Filter and Map
    # We want to keep Top N regions + Background
    # Background is ID 0.
    
    unique_ids, counts = np.unique(raw_labels, return_counts=True)
    sorted_indices = np.argsort(-counts)
    
    # Let's select regions with at least X vertices to be significant
    MIN_VERTICES = 100
    
    selected_ids = []
    
    print("\n--- Region Selection ---")
    for i in sorted_indices:
        uid = unique_ids[i]
        count = counts[i]
        name = id_to_name.get(uid, "Background" if uid == 0 else f"ID {uid}")
        
        if count >= MIN_VERTICES:
            selected_ids.append(uid)
            print(f"Keep: {name} (ID: {uid}, Count: {count})")
        else:
            # Too small, map to background?
            pass
            
    # Create Mapping: Dense ID -> {Original ID, Name}
    # Index 0 is always Background
    
    dense_map = {} # New ID -> Name
    conversion_map = {} # Old ID -> New ID

    # Ensure background is 0
    if 0 in selected_ids:
        dense_map[0] = "background"
        conversion_map[0] = 0
        selected_ids.remove(0)
    else:
        dense_map[0] = "background"
        conversion_map[0] = 0
        
    for i, uid in enumerate(selected_ids):
        new_id = i + 1
        name = id_to_name.get(uid, f"Region_{uid}")
        dense_map[new_id] = name
        conversion_map[uid] = new_id
        
    print(f"\nFinal Class Count: {len(dense_map)}")
    
    # 3. Transform Labels
    new_labels = np.zeros_like(raw_labels)
    # Vectorized mapping is tricky with sparse dict, use loop or pandas-like map.
    # Since classes are small (e.g. 50), loop over classes
    
    hits = 0
    for old_id, new_id in conversion_map.items():
        mask = (raw_labels == old_id)
        new_labels[mask] = new_id
        hits += np.sum(mask)
        
    print(f"Mapped {hits} / {len(raw_labels)} vertices to valid classes.")
    
    # 4. Save
    # Backup raw
    if not os.path.exists(raw_backup_path):
        os.rename(raw_labels_path, raw_backup_path) # Move original to backup
        print(f"Backed up raw labels to {raw_backup_path}")
    else:
        print(f"Raw backup already exists at {raw_backup_path}")
        
    np.save(output_labels_path, new_labels)
    print(f"Saved dense labels to {output_labels_path}")
    
    with open(mapping_output_path, 'w') as f:
        json.dump(dense_map, f, indent=4)
    print(f"Saved region map to {mapping_output_path}")

if __name__ == "__main__":
    prepare_data()

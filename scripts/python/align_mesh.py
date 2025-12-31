
import os
import trimesh
import nrrd
import numpy as np

def align_mesh(mesh_path, atlas_path):
    print(f"--- Alignment Analysis ---")
    
    # 1. Load Mesh Info (from Blender Export)
    json_path = os.path.join("data", "atlas", "mesh_info.json")
    print(f"Loading Mesh Info: {json_path}")
    try:
        import json
        with open(json_path, 'r') as f:
            info = json.load(f)
            
        mesh_bounds = np.array(info['bounds'])
        mesh_center = np.array(info['center'])
        mesh_extents = np.array(info['extents'])
        
    except Exception as e:
        print(f"Error loading mesh info: {e}")
        return

    print(f"Mesh Bounds:\n{mesh_bounds}")
    print(f"Mesh Size (Extents): {mesh_extents}")
    print(f"Mesh Center: {mesh_center}")

    # 2. Load Atlas
    print(f"\nLoading Atlas: {atlas_path}")
    try:
        readdata, header = nrrd.read(atlas_path)
    except Exception as e:
        print(f"Error loading atlas: {e}")
        return

    # Atlas properties
    # The CCFv3 25um atlas typically has dimensions (528, 320, 456)
    # Directions and Spacing are crucial.
    # Dimensions are usually [Anterior-Posterior, Superior-Inferior, Left-Right] or similar permutation.
    
    shape = readdata.shape
    # Directions in the nrrd header define the physical orientation.
    # Default CCFv3 (25um) spacing is 0.025 mm per voxel.
    spacing = 0.025 
    
    # Physical size in mm
    # Assuming isotropic 25 micron
    atlas_physical_size = np.array(shape) * spacing
    atlas_center_mm = atlas_physical_size / 2.0
    
    print(f"Atlas Shape (Voxels): {shape}")
    print(f"Atlas Physical Size (mm): {atlas_physical_size}")
    print(f"Atlas Estimated Center (mm): {atlas_center_mm}")
    
    # 3. Compute Alignment
    # Goal: Map Mesh -> Atlas (Physical Coordinates)
    # If the mesh is already in mm and roughly the right size (approx 10-15mm long), 
    # we just need to translate centers.
    
    # Scaling factor check
    # Mouse brain is roughly 13mm (AP) x 8mm (DV) x 11mm (ML).
    # Check mesh extents to see if it matches mm scale.
    
    print(f"\n--- Proposed Transformation ---")
    
    # Simple Center-to-Center Translation
    translation = atlas_center_mm - mesh_center
    
    # Scale check
    # Let's assume the largest dimension of the mesh corresponds to the largest dimension of the atlas (Anterior-Posterior usually)
    max_mesh_dim = np.max(mesh_extents)
    max_atlas_dim = np.max(atlas_physical_size)
    
    scale_factor = 1.0
    if max_mesh_dim > 0:
        # If mesh is huge (e.g. unit 1 = 1 meter or 1000mm), or tiny (unit 1 = 1 cm), valid scale is roughly 13mm.
        # If mesh max dim is e.g. 10.0, it's likely already in mm.
        # If mesh max dim is 1.0 (normalized), we need to scale up by ~13.
        # If mesh max dim is 10000 (microns), we scale by 0.001 to get mm.
        
        # Heuristic: If mesh is close to atlas size (within factor of 2), assume mm.
        ratio = max_atlas_dim / max_mesh_dim
        
        if 0.5 < ratio < 2.0:
            print("Scale Hypothesis: Mesh is likely in mm units.")
        elif 500 < ratio < 2000:
             print("Scale Hypothesis: Mesh is likely in meters? Need huge scale down? Or mesh is tiny?")
             scale_factor = 1000.0 # Just a guess example
        elif 0.0005 < ratio < 0.002:
             print("Scale Hypothesis: Mesh is likely in microns. Scaling by 0.001.")
             scale_factor = 0.001
        else:
             print(f"Scale Hypothesis: Unknown units. Ratio Atlas/Mesh = {ratio:.2f}")
             # If mesh is normalized to unit cube, scale to match atlas bounds?
             scale_factor = max_atlas_dim / max_mesh_dim
             print(f"Proposed Scale to match bounds: {scale_factor:.4f}")

    print(f"Translation Vector (to match centroids): {translation}")
    print(f"Global Scale Factor: {scale_factor}")
    
    # Print the transform matrix for visual verification
    transform_matrix = np.eye(4)
    transform_matrix[:3, 3] = translation
    transform_matrix[:3, :3] *= scale_factor
    
    print("\nAffine Matrix (Mesh -> Atlas):")
    print(transform_matrix)
    
    # Save the matrix for the validation script to use
    np.save(os.path.join("data", "atlas", "alignment_matrix.npy"), transform_matrix)
    print("\nSaved alignment matrix to data/atlas/alignment_matrix.npy")

if __name__ == "__main__":
    MESH_FILE = "scripts/blender/brain.fbx"
    ATLAS_FILE = "data/atlas/annotation_25.nrrd"
    align_mesh(MESH_FILE, ATLAS_FILE)

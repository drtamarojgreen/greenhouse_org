
import os
import numpy as np
import trimesh

def assemble():
    # Paths
    source_dir = "data/atlas"
    dest_dir = "scripts/python"
    
    print("--- Assembling Data for Training ---")
    
    # 1. Load Geometry from Blender Export
    try:
        vertices = np.load(os.path.join(source_dir, "vertices.npy"))
        faces = np.load(os.path.join(source_dir, "faces.npy"))
        normals = np.load(os.path.join(source_dir, "vertex_normals.npy"))
        print(f"Loaded: {len(vertices)} Vertices, {len(faces)} Faces, {len(normals)} Normals")
    except FileNotFoundError as e:
        print(f"Error loading geometry: {e}. Run export_mesh_info.py first.")
        return

    # 2. Compute Curvature
    # We construct a trimesh object to use its curvature features
    print("Computing features...")
    mesh = trimesh.Trimesh(vertices=vertices, faces=faces, process=False)
    
    # Trimesh curvature
    try:
        # curvature.vertex_defects -> Gaussian Curvature approximation
        gaussian_curvature = trimesh.curvature.vertex_defects(mesh)
        
        # Mean curvature
        radius = mesh.edges_unique_length.mean() * 2
        mean_curvature = trimesh.curvature.discrete_mean_curvature_measure(mesh, mesh.vertices, radius)
        
        # Reshape for stacking
        gaussian_curvature = gaussian_curvature[:, np.newaxis]
        mean_curvature = mean_curvature[:, np.newaxis]
        
    except Exception as e:
        print(f"Warning: Curvature computation failed: {e}. Using zeros.")
        gaussian_curvature = np.zeros((len(vertices), 1))
        mean_curvature = np.zeros((len(vertices), 1))

    # 3. Assemble Feature Matrix
    # [x, y, z, nx, ny, nz, mean_curv, gauss_curv]
    features = np.hstack([vertices, normals, mean_curvature, gaussian_curvature])
    print(f"Feature Matrix Shape: {features.shape}")

    # 4. Save to Training Directory
    print(f"Saving data to {dest_dir}...")
    np.save(os.path.join(dest_dir, "vertices.npy"), vertices)
    np.save(os.path.join(dest_dir, "faces.npy"), faces)
    np.save(os.path.join(dest_dir, "features.npy"), features)
    
    # Labels should already be there from prepare_training_data.py
    if os.path.exists(os.path.join(dest_dir, "labels.npy")):
        print("verified labels.npy exists.")
    else:
        print("Warning: labels.npy missing! Run prepare_training_data.py.")

    print("Data assembly complete.")

if __name__ == "__main__":
    assemble()

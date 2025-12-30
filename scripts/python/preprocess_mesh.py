import os
import numpy as np
import trimesh
from fbxloader import FBXLoader

def preprocess_mesh():
    """
    Loads the brain.fbx mesh, extracts geometry and computes features,
    then saves them as NumPy arrays for the GNN pipeline.
    """
    # Define file paths relative to the repository root
    fbx_path = os.path.join('scripts', 'blender', 'brain.fbx')
    output_dir = os.path.join('data', 'graphs')
    vertices_path = os.path.join(output_dir, 'canonical_vertices.npy')
    faces_path = os.path.join(output_dir, 'canonical_faces.npy')
    features_path = os.path.join(output_dir, 'canonical_features.npy')

    # Ensure the output directory exists
    try:
        os.makedirs(output_dir, exist_ok=True)
        print(f"Output directory '{output_dir}' created or already exists.")
    except OSError as e:
        print(f"Error creating directory {output_dir}: {e}")
        return

    # Check if the input file exists
    if not os.path.exists(fbx_path):
        print(f"Error: Input file not found at '{fbx_path}'")
        return

    # Load the FBX file using fbxloader and export to a trimesh object
    print(f"Loading FBX file from '{fbx_path}'...")
    try:
        loader = FBXLoader(fbx_path)
        mesh = loader.export_trimesh()
        print("FBX file loaded and converted to trimesh object successfully.")
    except Exception as e:
        print(f"Error loading or converting FBX file: {e}")
        return

    # Extract vertices and faces
    vertices = np.array(mesh.vertices)
    faces = np.array(mesh.faces)
    print(f"Extracted {len(vertices)} vertices and {len(faces)} faces.")

    # Compute node features as specified in the GNN design
    print("Computing node features (coordinates, normals, curvatures)...")
    
    # 1. Coordinates (already have from vertices)
    
    # 2. Vertex Normals
    vertex_normals = np.array(mesh.vertex_normals)

    # 3. Curvature features
    # Gaussian curvature can be estimated from the vertex defects.
    gaussian_curvature = trimesh.curvature.vertex_defects(mesh)

    # For mean curvature, we need to define a radius for the neighborhood.
    # We'll use a radius equal to twice the mean edge length.
    radius = mesh.edges_unique_length.mean() * 2
    mean_curvature = trimesh.curvature.discrete_mean_curvature_measure(mesh, mesh.vertices, radius)
    
    print("Node features computed.")

    # Assemble the final feature matrix
    # The feature vector per node will be [x, y, z, nx, ny, nz, mean_curv, gauss_curv]
    features = np.hstack([
        vertices,
        vertex_normals,
        mean_curvature[:, np.newaxis],      # Reshape for horizontal stacking
        gaussian_curvature[:, np.newaxis]   # Reshape for horizontal stacking
    ])
    print(f"Assembled feature matrix with shape: {features.shape}")

    # Save the processed data as NumPy arrays
    print(f"Saving processed data to '{output_dir}'...")
    try:
        np.save(vertices_path, vertices)
        np.save(faces_path, faces)
        np.save(features_path, features)
        print("Processed data saved successfully:")
        print(f" - Vertices: {vertices_path}")
        print(f" - Faces: {faces_path}")
        print(f" - Features: {features_path}")
    except IOError as e:
        print(f"Error saving data: {e}")

if __name__ == '__main__':
    preprocess_mesh()

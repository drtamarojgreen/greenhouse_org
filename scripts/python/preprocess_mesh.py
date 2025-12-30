import os
import numpy as np
import trimesh
from fbxloader import FBXLoader

def preprocess_mesh():
    """
    Loads the brain.fbx mesh, extracts basic geometry (vertices and faces),
    and saves them as NumPy arrays.

    TODO: Extend this script to compute and save node features, such as
    vertex normals and curvatures, as specified in the GNN design.
    """
    # Define file paths relative to the repository root
    fbx_path = os.path.join('scripts', 'blender', 'brain.fbx')
    output_dir = os.path.join('data', 'graphs')
    vertices_path = os.path.join(output_dir, 'canonical_vertices.npy')
    faces_path = os.path.join(output_dir, 'canonical_faces.npy')

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

    # Load the FBX file
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

    # Save the processed data as NumPy arrays
    print(f"Saving processed data to '{output_dir}'...")
    try:
        np.save(vertices_path, vertices)
        np.save(faces_path, faces)
        print("Processed data saved successfully:")
        print(f" - Vertices: {vertices_path}")
        print(f" - Faces: {faces_path}")
    except IOError as e:
        print(f"Error saving data: {e}")

if __name__ == '__main__':
    preprocess_mesh()

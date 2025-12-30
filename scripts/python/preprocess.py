"""
Preprocesses the brain.fbx file to generate graph data for the GNN.
"""
import os
import trimesh
import numpy as np
import pyassimp
from trimesh.curvature import vertex_defects

def preprocess_fbx(fbx_path, output_dir):
    """
    Loads an FBX file, extracts mesh data, computes features, and saves them.

    Args:
        fbx_path (str): Path to the FBX file.
        output_dir (str): Directory to save the output .npy files.
    """
    print(f"Loading mesh from {fbx_path}...")
    try:
        with pyassimp.load(fbx_path) as scene:
            if not scene.meshes:
                print("No meshes found in the FBX file.")
                return
            # Assuming the first mesh is the one we want
            mesh_data = scene.meshes[0]
            mesh = trimesh.Trimesh(vertices=mesh_data.vertices,
                                  faces=mesh_data.faces,
                                  vertex_normals=mesh_data.normals)
            mesh.process()
    except Exception as e:
        print(f"Error loading mesh: {e}")
        return

    print("Extracting vertices and faces...")
    vertices = np.array(mesh.vertices)
    faces = np.array(mesh.faces)

    print("Computing node features...")
    # 1. Coordinates (already have them)
    # 2. Normals
    vertex_normals = np.array(mesh.vertex_normals)
    # 3. Curvature
    # Note: trimesh.curvature is experimental and may not be robust.
    # We'll include it for now as a starting point.
    try:
        # For some meshes, principal_curvature_vectors might fail.
        # We'll use the simpler curvature for now.
        curvature = vertex_defects(mesh)
        if curvature.ndim == 1:
            curvature = curvature.reshape(-1, 1)

    except Exception as e:
        print(f"Could not compute curvature, using zeros instead: {e}")
        curvature = np.zeros((len(vertices), 1))


    # Ensure all feature arrays have the same number of vertices
    if not all(len(f) == len(vertices) for f in [vertex_normals, curvature]):
        print("Feature dimensions do not match vertex count. Aborting.")
        return

    features = np.hstack([vertices, vertex_normals, curvature])

    print("Generating placeholder labels...")
    # Placeholder labels (e.g., all background)
    labels = np.zeros(len(vertices), dtype=int)

    print("Saving processed data...")
    np.save(os.path.join(output_dir, "vertices.npy"), vertices)
    np.save(os.path.join(output_dir, "faces.npy"), faces)
    np.save(os.path.join(output_dir, "features.npy"), features)
    np.save(os.path.join(output_dir, "labels.npy"), labels)

    print("Preprocessing complete.")

if __name__ == "__main__":
    # Assuming the script is run from the project root
    FBX_FILE = "scripts/blender/brain.fbx"
    OUTPUT_DIR = "scripts/python/"
    
    if not os.path.exists(FBX_FILE):
        print(f"Error: {FBX_FILE} not found. Make sure you are in the project root.")
    else:
        preprocess_fbx(FBX_FILE, OUTPUT_DIR)

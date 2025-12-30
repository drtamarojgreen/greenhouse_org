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
    labels_path = os.path.join(output_dir, 'canonical_labels.npy')

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

    # Generate labels from vertex colors.
    print("Generating labels from vertex colors...")
    vertex_colors = mesh.visual.vertex_colors
    labels = np.zeros(len(vertices), dtype=int)

    # Define a simple color-to-label mapping.
    # Note: This is a simplified mapping. A more robust solution would
    # handle a wider range of colors and potentially use a clustering algorithm.
    color_map = {
        (255, 0, 0, 255): 1,  # Red -> left_amygdala
        (0, 255, 0, 255): 2,  # Green -> right_amygdala
        (0, 0, 255, 255): 3,  # Blue -> left_hippocampus
        (255, 255, 0, 255): 4, # Yellow -> right_hippocampus
    }

    for i, color in enumerate(vertex_colors):
        # Convert color to a tuple for dictionary lookup.
        color_tuple = tuple(map(int, color))
        if color_tuple in color_map:
            labels[i] = color_map[color_tuple]

    print(f"Generated {len(np.unique(labels))} unique labels.")

    # Compute node features as specified in the GNN design
    print("Computing node features (coordinates, normals, curvatures)...")
    
    # 1. Coordinates (already have from vertices)
    
    # 2. Vertex Normals
    vertex_normals = np.array(mesh.vertex_normals)

    # 3. Curvature features
    # Using a simpler curvature calculation to avoid timeout.
    try:
        mesh.add_attribute('curvature', mesh.curvature)
        curvature = mesh.vertex_attributes['curvature']
        if curvature.ndim == 1:
            curvature = curvature.reshape(-1, 1)
    except Exception as e:
        print(f"Could not compute curvature, using zeros instead: {e}")
        curvature = np.zeros((len(vertices), 1))

    print("Node features computed.")

    # Assemble the final feature matrix
    # The feature vector per node will be [x, y, z, nx, ny, nz, curvature]
    features = np.hstack([
        vertices,
        vertex_normals,
        curvature
    ])
    print(f"Assembled feature matrix with shape: {features.shape}")

    # Save the processed data as NumPy arrays
    print(f"Saving processed data to '{output_dir}'...")
    try:
        np.save(vertices_path, vertices)
        np.save(faces_path, faces)
        np.save(features_path, features)
        np.save(labels_path, labels)
        print("Processed data saved successfully:")
        print(f" - Vertices: {vertices_path}")
        print(f" - Faces: {faces_path}")
        print(f" - Features: {features_path}")
        print(f" - Labels: {labels_path}")
    except IOError as e:
        print(f"Error saving data: {e}")

if __name__ == '__main__':
    preprocess_mesh()

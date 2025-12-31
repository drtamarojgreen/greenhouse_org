"""
Performs inference on a new mesh using the trained GNN model.
"""
import os
import json
import trimesh
import numpy as np
from scipy import sparse
from config import get_region_config

# We can reuse these functions from the training script
from train import gcn_forward, relu

def inference(fbx_path, model_dir, output_dir):
    """
    Loads a mesh, preprocesses it, and runs the GNN model to predict regions.

    Args:
        fbx_path (str): Path to the input FBX file.
        model_dir (str): Directory containing the trained model weights.
        output_dir (str): Directory to save the output JSON file.
    """
    print("Loading model weights...")
    try:
        # Check for metadata
        meta_path = os.path.join(model_dir, "model_meta.json")
        if os.path.exists(meta_path):
            with open(meta_path, 'r') as f:
                meta = json.load(f)
            depth = meta.get("depth", 3)
        else:
            print("Warning: model_meta.json not found, assuming depth=3")
            depth = 3
            
        weights = []
        for i in range(depth):
            w_path = os.path.join(model_dir, f"gcn_w{i+1}.npy")
            weights.append(np.load(w_path))
            
    except FileNotFoundError as e:
        print(f"Error: {e}. Make sure you have run train.py first.")
        return

    print(f"Loading mesh from {fbx_path} for inference...")
    try:
        mesh = trimesh.load(fbx_path, force='mesh')
    except Exception as e:
        print(f"Error loading mesh: {e}")
        return

    print("Preprocessing mesh...")
    vertices = np.array(mesh.vertices)
    faces = np.array(mesh.faces)
    vertex_normals = np.array(mesh.vertex_normals)

    try:
        mesh.add_attribute('curvature', mesh.curvature)
        curvature = mesh.vertex_attributes['curvature']
        if curvature.ndim == 1:
            curvature = curvature.reshape(-1, 1)
    except Exception as e:
        print(f"Could not compute curvature, using zeros instead: {e}")
        curvature = np.zeros((len(vertices), 1))

    features = np.hstack([vertices, vertex_normals, curvature])

    print("Constructing graph for inference...")
    num_vertices = len(vertices)
    edges = np.vstack([faces[:, [0, 1]], faces[:, [1, 2]], faces[:, [2, 0]]])
    edges = np.sort(edges, axis=1)
    edges = np.unique(edges, axis=0)

    adj = sparse.coo_matrix((np.ones(len(edges)), (edges[:, 0], edges[:, 1])),
                            shape=(num_vertices, num_vertices))
    adj = adj + adj.T + sparse.eye(num_vertices)
    adj = adj.tocsr()

    rowsum = np.array(adj.sum(1))
    d_inv_sqrt = np.power(rowsum, -0.5).flatten()
    d_inv_sqrt[np.isinf(d_inv_sqrt)] = 0.
    d_mat_inv_sqrt = sparse.diags(d_inv_sqrt)
    adj_normalized = d_mat_inv_sqrt.dot(adj).dot(d_mat_inv_sqrt)

    print("Performing forward pass...")
    curr_H = features
    
    # Hidden layers (ReLU)
    for i in range(len(weights) - 1):
        W = weights[i]
        curr_H = relu(gcn_forward(adj_normalized, curr_H, W))
        
    # Output layer (No ReLU)
    W_last = weights[-1]
    logits = gcn_forward(adj_normalized, curr_H, W_last)

    predicted_labels = np.argmax(logits, axis=1)
    print("Inference complete.")

    print("Saving predicted regions...")
    region_config = get_region_config()
    region_names = {v: k for k, v in region_config.items()}

    predictions = {region_name: [] for region_name in region_config.values()}
    for i, label_idx in enumerate(predicted_labels):
        if label_idx in region_names:
            region_name = region_names[label_idx]
            predictions[region_name].append(i)

    output_path = os.path.join(output_dir, "regions_pred.json")
    with open(output_path, 'w') as f:
        json.dump(predictions, f, indent=2)

    print(f"Predicted regions saved to {output_path}")

if __name__ == "__main__":
    FBX_FILE = "scripts/blender/brain.fbx"
    MODEL_DIR = "scripts/python/"
    OUTPUT_DIR = "scripts/python/"
    inference(FBX_FILE, MODEL_DIR, OUTPUT_DIR)

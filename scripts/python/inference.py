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

def inference(data_dir, model_dir, output_dir):
    """
    Loads a mesh, preprocesses it, and runs the GNN model to predict regions.

    Args:
        data_dir (str): Path to the directory containing the preprocessed graph data.
        model_dir (str): Directory containing the trained model weights.
        output_dir (str): Directory to save the output JSON file.
    """
    print("Loading model weights and data for inference...")
    try:
        W1 = np.load(os.path.join(model_dir, "gcn_w1.npy"))
        W2 = np.load(os.path.join(model_dir, "gcn_w2.npy"))
        W3 = np.load(os.path.join(model_dir, "gcn_w3.npy"))

        vertices = np.load(os.path.join(data_dir, "canonical_vertices.npy"))
        faces = np.load(os.path.join(data_dir, "canonical_faces.npy"))
        features = np.load(os.path.join(data_dir, "canonical_features.npy"))

    except FileNotFoundError as e:
        print(f"Error: {e}. Make sure you have run preprocess_mesh.py and train.py first.")
        return

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
    H1 = relu(gcn_forward(adj_normalized, features, W1))
    H2 = relu(gcn_forward(adj_normalized, H1, W2))
    logits = gcn_forward(adj_normalized, H2, W3)

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
    DATA_DIR = "data/graphs/"
    MODEL_DIR = "data/graphs/"
    OUTPUT_DIR = "data/graphs/"
    inference(DATA_DIR, MODEL_DIR, OUTPUT_DIR)

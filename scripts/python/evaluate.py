"""
Evaluates the trained GNN model.
"""
import os
import numpy as np
from scipy import sparse
from config import get_region_config

# We can reuse these functions from the training script
from train import gcn_forward, relu, softmax

def evaluate(data_dir, model_dir):
    """
    Loads data and a trained model to evaluate its performance.

    Args:
        data_dir (str): Directory containing the .npy files.
        model_dir (str): Directory containing the trained model weights.
    """
    print("Loading data and model for evaluation...")
    try:
        vertices = np.load(os.path.join(data_dir, "vertices.npy"))
        faces = np.load(os.path.join(data_dir, "faces.npy"))
        features = np.load(os.path.join(data_dir, "features.npy"))
        labels = np.load(os.path.join(data_dir, "labels.npy"))

        W1 = np.load(os.path.join(model_dir, "gcn_w1.npy"))
        W2 = np.load(os.path.join(model_dir, "gcn_w2.npy"))
        W3 = np.load(os.path.join(model_dir, "gcn_w3.npy"))
    except FileNotFoundError as e:
        print(f"Error: {e}. Make sure you have run preprocess.py and train.py first.")
        return

    print("Reconstructing graph...")
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

    # Get predictions
    predicted_labels = np.argmax(logits, axis=1)

    # Calculate accuracy
    accuracy = np.mean(predicted_labels == labels)

    print("\n--- Evaluation Results ---")
    print(f"Accuracy: {accuracy * 100:.2f}%")
    print("--------------------------")

if __name__ == "__main__":
    DATA_DIR = "scripts/python/"
    MODEL_DIR = "scripts/python/"
    evaluate(DATA_DIR, MODEL_DIR)

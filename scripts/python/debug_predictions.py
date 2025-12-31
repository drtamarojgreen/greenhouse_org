import numpy as np
import os
import io
import sys

# Redirect stdout to capture output if needed, though we will just print
from scipy import sparse

# Mock config to avoid import errors if path issues
def get_region_config():
    import json
    with open("scripts/python/region_map.json", 'r') as f:
        mapping = json.load(f)
    return {int(k): v for k, v in mapping.items()}

def gcn_forward(adj, features, weights):
    return adj.dot(features).dot(weights)

def relu(x):
    return np.maximum(0, x)

data_dir = "scripts/python"
model_dir = "scripts/python"

print("Loading data...")
vertices = np.load(os.path.join(data_dir, "vertices.npy"))
faces = np.load(os.path.join(data_dir, "faces.npy"))
features = np.load(os.path.join(data_dir, "features.npy"))
labels = np.load(os.path.join(data_dir, "labels.npy"))

print("Loading weights...")
import json
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

print("Forward pass...")
curr_H = features

# Hidden layers (ReLU)
for i in range(len(weights) - 1):
    W = weights[i]
    curr_H = relu(gcn_forward(adj_normalized, curr_H, W))
    
# Output layer (No ReLU)
W_last = weights[-1]
logits = gcn_forward(adj_normalized, curr_H, W_last)
preds = np.argmax(logits, axis=1)

print("\n--- Prediction Analysis ---")
unique, counts = np.unique(preds, return_counts=True)
region_config = get_region_config()

print("\nPredicted Class Counts:")
for u, c in zip(unique, counts):
    name = region_config.get(u, "Unknown")
    print(f"Class {u} ({name}): {c}")

accuracy = np.mean(preds == labels)
print(f"\nRecalculated Accuracy: {accuracy * 100:.2f}%")

# Check if it's predicting indices or something else
print(f"Logits range: {logits.min():.4f} to {logits.max():.4f}")
print(f"Logits mean: {logits.mean():.4f}")

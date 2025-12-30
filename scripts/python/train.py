"""
Trains a Graph Neural Network (GNN) on the preprocessed brain mesh data using only numpy and scipy.
"""
import os
import numpy as np
from scipy import sparse
from config import get_train_config, get_region_config

def softmax(x):
    """Compute softmax values for each sets of scores in x."""
    e_x = np.exp(x - np.max(x, axis=1, keepdims=True))
    return e_x / e_x.sum(axis=1, keepdims=True)

def cross_entropy_loss(y_pred, y_true):
    """
    Computes the cross-entropy loss.

    Args:
        y_pred (np.ndarray): Predicted probabilities, shape (N, K).
        y_true (np.ndarray): True labels, shape (N,).

    Returns:
        float: The cross-entropy loss.
    """
    m = y_true.shape[0]
    p = softmax(y_pred)
    log_likelihood = -np.log(p[range(m), y_true])
    loss = np.sum(log_likelihood) / m
    return loss

def gcn_forward(adj, features, weights):
    """
    Performs the forward pass for a single GCN layer.

    Args:
        adj (scipy.sparse.csr_matrix): Normalized adjacency matrix.
        features (np.ndarray): Input features for the layer.
        weights (np.ndarray): Weight matrix for the layer.

    Returns:
        np.ndarray: Output features of the layer.
    """
    return adj.dot(features).dot(weights)

def relu(x):
    """ReLU activation function."""
    return np.maximum(0, x)

def train(data_dir, model_dir):
    """
    Loads preprocessed data, builds and trains the GNN model.

    Args:
        data_dir (str): Directory containing the .npy files.
        model_dir (str): Directory to save the trained model weights.
    """
    print("Loading training data...")
    try:
        vertices = np.load(os.path.join(data_dir, "vertices.npy"))
        faces = np.load(os.path.join(data_dir, "faces.npy"))
        features = np.load(os.path.join(data_dir, "features.npy"))
        labels = np.load(os.path.join(data_dir, "labels.npy"))
    except FileNotFoundError as e:
        print(f"Error: {e}. Make sure you have run preprocess.py first.")
        return

    train_config = get_train_config()
    region_config = get_region_config()

    print("Constructing graph...")
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


    print("Initializing model and weights...")
    np.random.seed(train_config["random_seed"])
    in_dim = features.shape[1]
    hidden_dim = train_config["hidden_size"]
    out_dim = len(region_config)

    # Initialize weights
    W1 = np.random.randn(in_dim, hidden_dim) * 0.01
    W2 = np.random.randn(hidden_dim, hidden_dim) * 0.01
    W3 = np.random.randn(hidden_dim, out_dim) * 0.01

    print("Starting training...")
    for epoch in range(train_config["epochs"]):
        # Forward pass
        H1 = relu(gcn_forward(adj_normalized, features, W1))
        H2 = relu(gcn_forward(adj_normalized, H1, W2))
        H3 = gcn_forward(adj_normalized, H2, W3) # Logits

        # Compute loss
        loss = cross_entropy_loss(H3, labels)
        if (epoch + 1) % 10 == 0:
            print(f"Epoch {epoch+1:03d}, Loss: {loss:.4f}")

        # Backward pass (manual gradient computation)
        # This is a simplified version and not a full backpropagation.
        # For a real-world scenario, a more complete gradient calculation is needed.
        # This is for demonstration purposes.

        # Gradient of the loss with respect to the output H3
        m = labels.shape[0]
        p = softmax(H3)
        p[range(m), labels] -= 1
        grad_H3 = p / m

        # Gradient for W3
        grad_W3 = H2.T.dot(grad_H3)

        # Backpropagate gradient to H2
        grad_H2 = grad_H3.dot(W3.T)
        grad_H2[H2 <= 0] = 0 # ReLU gradient

        # Gradient for W2
        grad_W2 = H1.T.dot(grad_H2)

        # Backpropagate gradient to H1
        grad_H1 = grad_H2.dot(W2.T)
        grad_H1[H1 <= 0] = 0 # ReLU gradient

        # Gradient for W1
        grad_W1 = features.T.dot(grad_H1)

        # Update weights
        lr = train_config["learning_rate"]
        W1 -= lr * grad_W1
        W2 -= lr * grad_W2
        W3 -= lr * grad_W3


    print("Training complete.")

    print("Saving model weights...")
    if not os.path.exists(model_dir):
        os.makedirs(model_dir)

    np.save(os.path.join(model_dir, "gcn_w1.npy"), W1)
    np.save(os.path.join(model_dir, "gcn_w2.npy"), W2)
    np.save(os.path.join(model_dir, "gcn_w3.npy"), W3)
    print(f"Model weights saved in {model_dir}")


if __name__ == "__main__":
    DATA_DIR = "scripts/python/"
    MODEL_DIR = "scripts/python/"
    train(DATA_DIR, MODEL_DIR)

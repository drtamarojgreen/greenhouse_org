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
    """
    m = y_true.shape[0]
    p = softmax(y_pred)
    log_likelihood = -np.log(p[range(m), y_true])
    loss = np.sum(log_likelihood) / m
    return loss

def gcn_forward(adj, features, weights):
    """
    Performs the forward pass for a single GCN layer.
    """
    return adj.dot(features).dot(weights)

def relu(x):
    """ReLU activation function."""
    return np.maximum(0, x)

def dropout(x, drop_prob):
    """
    Inverted dropout.
    """
    if drop_prob == 0:
        return x, None
    mask = (np.random.rand(*x.shape) > drop_prob) / (1.0 - drop_prob)
    return x * mask, mask

def train(data_dir, model_dir):
    """
    Loads preprocessed data, builds and trains the GNN model.
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


    print("Initializing model and weights (Dynamic)...")
    np.random.seed(train_config["random_seed"])
    
    depth = train_config["gnn_depth"]
    hidden_dim = train_config["hidden_size"]
    in_dim = features.shape[1]
    out_dim = len(region_config)
    drop_prob = train_config.get("dropout", 0.0)

    # Xavier Initialization
    def xavier_init(shape):
        limit = np.sqrt(6.0 / (shape[0] + shape[1]))
        return np.random.uniform(-limit, limit, size=shape)

    # Weights list: [W1, W2, ..., W_depth]
    weights = []
    
    # First layer
    weights.append(xavier_init((in_dim, hidden_dim)))
    
    # Hidden layers
    for _ in range(depth - 2):
        weights.append(xavier_init((hidden_dim, hidden_dim)))
        
    # Output layer
    weights.append(xavier_init((hidden_dim, out_dim)))

    print(f"Model Depth: {len(weights)} layers")

    print("Starting training with Adam...")
    # Adam parameters
    beta1 = 0.9
    beta2 = 0.999
    eps = 1e-8
    
    # Adam states
    m_weights = [np.zeros_like(w) for w in weights]
    v_weights = [np.zeros_like(w) for w in weights]

    for epoch in range(train_config["epochs"]):
        t = epoch + 1
        
        # --- Forward Pass ---
        activations = [features] # H0, H1, ...
        dropout_masks = []
        
        # Hidden layers
        curr_H = features
        for i in range(len(weights) - 1):
            W = weights[i]
            # Z = A * H * W
            Z = gcn_forward(adj_normalized, curr_H, W)
            H = relu(Z)
            
            # Dropout
            H, mask = dropout(H, drop_prob)
            dropout_masks.append(mask)
            
            curr_H = H
            activations.append(curr_H)
            
        # Output layer (No ReLU, No Dropout)
        W_last = weights[-1]
        logits = gcn_forward(adj_normalized, curr_H, W_last)
        
        # --- Loss ---
        loss = cross_entropy_loss(logits, labels)
        if epoch % 1 == 0:
            print(f"Epoch {epoch+1:03d}/{train_config['epochs']}, Loss: {loss:.4f}")

        # --- Backward Pass ---
        
        m = labels.shape[0]
        p = softmax(logits)
        p[range(m), labels] -= 1
        grad_output = p / m # dL/dZ_last
        
        grads = [None] * len(weights)
        
        # Backprop Output Layer
        # Z_last = A * H_last_hidden * W_last
        # dL/dW_last = (A * H_last_hidden).T * dL/dZ_last
        H_last_hidden = activations[-1]
        AH_last = adj_normalized.dot(H_last_hidden)
        grads[-1] = AH_last.T.dot(grad_output)
        
        # Error to propagate back
        # dL/dH_last_hidden = A * (dL/dZ_last * W_last.T)
        grad_H = adj_normalized.dot(grad_output.dot(W_last.T))
        
        # Backprop Hidden Layers (Reverse loop)
        for i in range(len(weights) - 2, -1, -1):
            # Apply dropout mask backwards
            mask = dropout_masks[i]
            if mask is not None:
                grad_H = grad_H * mask #/ (1-drop_prob) is baked into forward mask
            
            # ReLU Derivative
            H_prev = gcn_forward(adj_normalized, activations[i], weights[i]) # Recompute linear Z for simplicity or store it?
            # Actually simpler: H_current = ReLU(Z), so grad is 0 where H_current <= 0
            # activations[i+1] is the H output of this layer
            grad_H[activations[i+1] <= 0] = 0
            
            # W gradient
            # Z_i = A * H_in * W_i
            H_in = activations[i]
            AH_in = adj_normalized.dot(H_in)
            grads[i] = AH_in.T.dot(grad_H)
            
            # Propagate to next lower H
            # dL/dH_in = A * (grad_H * W_i.T)
            if i > 0: # No need to calc grad for input features
                grad_H = adj_normalized.dot(grad_H.dot(weights[i].T))

        # --- Update Weights (Adam) ---
        lr = train_config["learning_rate"]
        
        for i in range(len(weights)):
            g = grads[i]
            mW = m_weights[i]
            vW = v_weights[i]
            
            mW = beta1 * mW + (1 - beta1) * g
            vW = beta2 * vW + (1 - beta2) * (g ** 2)
            
            m_hat = mW / (1 - beta1 ** t)
            v_hat = vW / (1 - beta2 ** t)
            
            weights[i] -= lr * m_hat / (np.sqrt(v_hat) + eps)
            
            m_weights[i] = mW
            v_weights[i] = vW


    print("Training complete.")

    print("Saving model weights...")
    if not os.path.exists(model_dir):
        os.makedirs(model_dir)

    # Save all layers: gcn_w1.npy, gcn_w2.npy, ...
    for i, W in enumerate(weights):
        np.save(os.path.join(model_dir, f"gcn_w{i+1}.npy"), W)
        
    # Save metadata about depth so inference knows what to load
    with open(os.path.join(model_dir, "model_meta.json"), 'w') as f:
        import json
        json.dump({"depth": len(weights)}, f)
        
    print(f"Model weights saved in {model_dir}")


if __name__ == "__main__":
    DATA_DIR = "scripts/python/"
    MODEL_DIR = "scripts/python/"
    train(DATA_DIR, MODEL_DIR)

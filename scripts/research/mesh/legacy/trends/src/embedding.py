import numpy as np
from .neural_net import SimpleAutoencoder

def center_matrix(matrix):
    mean = np.mean(matrix, axis=0)
    return matrix - mean

def compute_pca_embeddings(matrix, n_components):
    centered = center_matrix(matrix)
    U, S, Vt = np.linalg.svd(centered, full_matrices=False)
    return U[:, :n_components] * S[:n_components]

def compute_nn_embeddings(matrix, n_components, epochs=50, lr=0.01):
    """
    Compute embeddings using a NumPy Autoencoder.
    """
    # Normalize matrix to [0, 1] for sigmoid activation
    min_val = np.min(matrix)
    max_val = np.max(matrix)
    if max_val > min_val:
        normalized = (matrix - min_val) / (max_val - min_val)
    else:
        normalized = matrix

    ae = SimpleAutoencoder(matrix.shape[1], n_components, learning_rate=lr)
    ae.train(normalized, epochs=epochs)
    return ae.encode(normalized)

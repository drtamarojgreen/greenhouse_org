import numpy as np

def center_matrix(matrix):
    """
    Center the matrix (subtract mean).
    """
    mean = np.mean(matrix, axis=0)
    return matrix - mean

def compute_pca_embeddings(matrix, n_components):
    """
    Perform PCA using NumPy SVD.
    Ensure deterministic output.
    """
    # Center data
    centered = center_matrix(matrix)
    
    # SVD
    # U: Unitary matrix having left singular vectors as columns.
    # S: Vector with the singular values, sorted in descending order.
    # Vt: Unitary matrix having right singular vectors as rows.
    U, S, Vt = np.linalg.svd(centered, full_matrices=False)
    
    # Project data onto principal components
    # We use the first n_components
    return U[:, :n_components] * S[:n_components]
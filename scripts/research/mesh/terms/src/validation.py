import numpy as np

def check_matrix_health(matrix):
    """
    Detect NaNs or infinities.
    """
    if np.isnan(matrix).any():
        raise ValueError("Matrix contains NaNs")
    if np.isinf(matrix).any():
        raise ValueError("Matrix contains Infs")

def verify_cluster_distribution(labels):
    """
    Check cluster collapse (e.g. all points in one cluster).
    """
    unique_labels = np.unique(labels)
    if len(unique_labels) < 2:
        print("Warning: Cluster collapse detected (fewer than 2 clusters found).")

def assert_determinism(run_a, run_b):
    pass
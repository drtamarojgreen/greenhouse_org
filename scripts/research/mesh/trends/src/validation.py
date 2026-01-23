import numpy as np

def check_matrix_health(matrix):
    if np.isnan(matrix).any():
        raise ValueError("Matrix contains NaNs")
    if np.isinf(matrix).any():
        raise ValueError("Matrix contains Infs")

def verify_cluster_distribution(labels):
    unique_labels = np.unique(labels)
    if len(unique_labels) < 2:
        print("Warning: Cluster collapse detected (fewer than 2 clusters found).")

def assert_determinism(run_a, run_b):
    if isinstance(run_a, np.ndarray) and isinstance(run_b, np.ndarray):
        if not np.allclose(run_a, run_b):
            raise ValueError("Determinism check failed: arrays are not equal.")
    elif run_a != run_b:
        raise ValueError("Determinism check failed: values are not equal.")

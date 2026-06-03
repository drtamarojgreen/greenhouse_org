import numpy as np
import pandas as pd

def kmeans_fit(embeddings, k, seed=42):
    """
    Simple K-Means implementation using NumPy.
    """
    np.random.seed(seed)
    n_samples, n_features = embeddings.shape
    
    # Initialize centroids randomly
    random_indices = np.random.choice(n_samples, k, replace=False)
    centroids = embeddings[random_indices]
    
    labels = np.zeros(n_samples)
    
    # Simple iteration limit for convergence
    for _ in range(100):
        # Assign clusters
        # Compute distances
        distances = np.sqrt(((embeddings - centroids[:, np.newaxis])**2).sum(axis=2))
        new_labels = np.argmin(distances, axis=0)
        
        if np.all(labels == new_labels):
            break
            
        labels = new_labels
        
        # Update centroids
        for i in range(k):
            if np.any(labels == i):
                centroids[i] = embeddings[labels == i].mean(axis=0)
            else:
                # Handle empty cluster by re-initializing
                centroids[i] = embeddings[np.random.choice(n_samples)]
                
    return labels, centroids

def assign_clusters(terms, labels):
    """
    Create a DataFrame mapping terms to cluster labels.
    """
    return pd.DataFrame({
        'term': terms,
        'cluster': labels
    })
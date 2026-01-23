import numpy as np
import pandas as pd

def kmeans_fit(embeddings, k, seed=42):
    np.random.seed(seed)
    n_samples, n_features = embeddings.shape
    random_indices = np.random.choice(n_samples, k, replace=False)
    centroids = embeddings[random_indices]
    labels = np.zeros(n_samples)
    for _ in range(100):
        distances = np.sqrt(((embeddings - centroids[:, np.newaxis])**2).sum(axis=2))
        new_labels = np.argmin(distances, axis=0)
        if np.all(labels == new_labels):
            break
        labels = new_labels
        for i in range(k):
            if np.any(labels == i):
                centroids[i] = embeddings[labels == i].mean(axis=0)
            else:
                centroids[i] = embeddings[np.random.choice(n_samples)]
    return labels, centroids

def assign_clusters(terms, labels):
    return pd.DataFrame({
        'term': terms,
        'cluster': labels
    })

"""
Manual implementation of Unsupervised Learning (K-Means) in pure Python.
"""

import math
import random

class KMeans:
    def __init__(self, k=3, max_iters=100, tol=0.0001):
        self.k = k
        self.max_iters = max_iters
        self.tol = tol
        self.centroids = []
        self.labels = []

    def fit(self, data):
        """
        Trains the K-Means model on the data.
        Data is a list of vectors (lists of floats).
        """
        if not data:
            return

        dims = len(data[0])
        # Initialize centroids randomly from data points
        self.centroids = random.sample(data, self.k)

        for _ in range(self.max_iters):
            # Assign clusters
            self.labels = [self._closest_centroid(point) for point in data]

            # Update centroids
            new_centroids = []
            for i in range(self.k):
                # Get all points assigned to cluster i
                points = [data[j] for j, label in enumerate(self.labels) if label == i]
                if not points:
                    # If a cluster is empty, keep the old centroid (or re-init)
                    new_centroids.append(self.centroids[i])
                else:
                    # Calculate mean
                    mean_point = [sum(dim) / len(points) for dim in zip(*points)]
                    new_centroids.append(mean_point)

            # Check for convergence
            shift = 0
            for i in range(self.k):
                dist = self._euclidean_distance(self.centroids[i], new_centroids[i])
                shift += dist

            self.centroids = new_centroids
            if shift < self.tol:
                break

    def predict(self, point):
        """Returns the index of the closest cluster for a new point."""
        return self._closest_centroid(point)

    def _closest_centroid(self, point):
        min_dist = float('inf')
        idx = -1
        for i, centroid in enumerate(self.centroids):
            dist = self._euclidean_distance(point, centroid)
            if dist < min_dist:
                min_dist = dist
                idx = i
        return idx

    def _euclidean_distance(self, p1, p2):
        return math.sqrt(sum((a - b) ** 2 for a, b in zip(p1, p2)))

def normalize_vectors(vectors):
    """
    Min-Max normalization for a list of vectors.
    """
    if not vectors:
        return []

    dims = len(vectors[0])
    min_vals = [float('inf')] * dims
    max_vals = [-float('inf')] * dims

    for v in vectors:
        for i in range(dims):
            if v[i] < min_vals[i]: min_vals[i] = v[i]
            if v[i] > max_vals[i]: max_vals[i] = v[i]

    normalized = []
    for v in vectors:
        norm_v = []
        for i in range(dims):
            denom = max_vals[i] - min_vals[i]
            if denom == 0:
                norm_v.append(0)
            else:
                norm_v.append((v[i] - min_vals[i]) / denom)
        normalized.append(norm_v)

    return normalized

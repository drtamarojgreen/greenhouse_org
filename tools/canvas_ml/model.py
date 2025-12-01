
import math
import random

class KMeans:
    def __init__(self, k=3, max_iters=100, tol=0.0001):
        self.k = k
        self.max_iters = max_iters
        self.tol = tol
        self.centroids = []

    def fit(self, data):
        """
        Fits the model to the data.
        Data is a list of lists (vectors).
        """
        if not data:
            return

        n_samples = len(data)
        n_features = len(data[0])

        # Initialize centroids randomly from data points
        # For reproducibility, we could seed, but for now we use random
        random.seed(42)
        self.centroids = [data[i] for i in random.sample(range(n_samples), min(self.k, n_samples))]

        # If we asked for more clusters than data points, just take all data points
        if len(self.centroids) < self.k:
            self.k = len(self.centroids)

        for _ in range(self.max_iters):
            clusters = [[] for _ in range(self.k)]

            # Assign each point to the nearest centroid
            for point in data:
                distances = [self._euclidean_distance(point, centroid) for centroid in self.centroids]
                closest_index = distances.index(min(distances))
                clusters[closest_index].append(point)

            prev_centroids = list(self.centroids)

            # Update centroids
            for i in range(self.k):
                if clusters[i]:
                    self.centroids[i] = self._calculate_mean(clusters[i])
                else:
                    # Handle empty cluster? Keep old centroid or re-init.
                    # Keeping old is simplest for stability.
                    pass

            # Check convergence
            optimized = True
            for i in range(self.k):
                dist = self._euclidean_distance(prev_centroids[i], self.centroids[i])
                if dist > self.tol:
                    optimized = False
                    break

            if optimized:
                break

    def predict(self, point):
        """
        Predicts the closest cluster index for a single point.
        """
        if not self.centroids:
            return -1
        distances = [self._euclidean_distance(point, centroid) for centroid in self.centroids]
        return distances.index(min(distances))

    def _euclidean_distance(self, p1, p2):
        sum_sq = sum((a - b) ** 2 for a, b in zip(p1, p2))
        return math.sqrt(sum_sq)

    def _calculate_mean(self, points):
        n_points = len(points)
        n_features = len(points[0])
        mean_point = [0.0] * n_features

        for point in points:
            for i in range(n_features):
                mean_point[i] += point[i]

        return [x / n_points for x in mean_point]

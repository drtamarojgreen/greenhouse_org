import json
import os
import math
import sys

DATA_DIR = "tools/canvasml/data"
WIDTH = 64
HEIGHT = 64

def load_capture(i):
    path = os.path.join(DATA_DIR, f"capture_{i}.json")
    if not os.path.exists(path):
        return None
    with open(path, 'r') as f:
        return json.load(f)

def to_grayscale(pixels):
    # Pixels are [r, g, b, a, r, g, b, a...]
    gray = []
    for i in range(0, len(pixels), 4):
        r = pixels[i]
        g = pixels[i+1]
        b = pixels[i+2]
        # Luminosity method
        gray.append(0.299*r + 0.587*g + 0.114*b)
    return gray

def convolve_sobel(gray_pixels, width, height):
    # Simple Sobel Edge Detection
    # Gx = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]]
    # Gy = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]]

    edges = [0] * (width * height)

    for y in range(1, height-1):
        for x in range(1, width-1):
            idx = y * width + x

            # Neighbors
            # p0 p1 p2
            # p3 p4 p5
            # p6 p7 p8

            p0 = gray_pixels[(y-1)*width + (x-1)]
            p1 = gray_pixels[(y-1)*width + x]
            p2 = gray_pixels[(y-1)*width + (x+1)]
            p3 = gray_pixels[y*width + (x-1)]
            p5 = gray_pixels[y*width + (x+1)]
            p6 = gray_pixels[(y+1)*width + (x-1)]
            p7 = gray_pixels[(y+1)*width + x]
            p8 = gray_pixels[(y+1)*width + (x+1)]

            gx = (p2 + 2*p5 + p8) - (p0 + 2*p3 + p6)
            gy = (p6 + 2*p7 + p8) - (p0 + 2*p1 + p2)

            mag = math.sqrt(gx*gx + gy*gy)
            edges[idx] = mag

    return edges

def analyze_features(edges):
    # Feature: Total Edge Energy (Clutter metric)
    total_energy = sum(edges)
    return total_energy

def simple_kmeans(values, k=3):
    # 1D K-Means
    centroids = [min(values), (min(values)+max(values))/2, max(values)]
    for _ in range(10): # 10 iterations
        clusters = [[], [], []]
        for v in values:
            dists = [abs(v - c) for c in centroids]
            min_dist_idx = dists.index(min(dists))
            clusters[min_dist_idx].append(v)

        # Recompute centroids
        for i in range(k):
            if clusters[i]:
                centroids[i] = sum(clusters[i]) / len(clusters[i])
    return centroids, clusters

def main():
    print("Starting CanvasML Vision Analysis...")
    features = []
    valid_ids = []

    for i in range(50):
        pixels = load_capture(i)
        if not pixels:
            continue

        gray = to_grayscale(pixels)
        edges = convolve_sobel(gray, WIDTH, HEIGHT)
        energy = analyze_features(edges)

        features.append(energy)
        valid_ids.append(i)

        if i % 10 == 0:
            print(f"Processed image {i}, Energy: {energy:.2f}")

    if not features:
        print("No data found.")
        return

    print("\nClustering Visual States (Clutter Analysis)...")
    centroids, clusters = simple_kmeans(features)

    labels = ["Low Complexity", "Medium Complexity", "High Complexity"]
    sorted_centroids = sorted(list(enumerate(centroids)), key=lambda x: x[1])

    print("\nResults:")
    for i in range(3):
        c_idx, c_val = sorted_centroids[i]
        count = len(clusters[c_idx])
        print(f"Cluster '{labels[i]}' (Centroid: {c_val:.2f}): {count} images")

if __name__ == "__main__":
    main()

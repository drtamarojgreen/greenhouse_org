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
    # Check if we have enough distinct values
    if len(set(values)) < k:
        return [0]*k, [[] for _ in range(k)]

    centroids = [min(values), (min(values)+max(values))/2, max(values)]
    for _ in range(10): # 10 iterations
        clusters = [[] for _ in range(k)]
        # Store indices as well to map back to original images if needed,
        # but here we just store values for centroid calculation.
        # To map back, we'd need (value, index) tuples.

        # Actually, let's just cluster the values to get centroids
        for v in values:
            dists = [abs(v - c) for c in centroids]
            min_dist_idx = dists.index(min(dists))
            clusters[min_dist_idx].append(v)

        # Recompute centroids
        for i in range(k):
            if clusters[i]:
                centroids[i] = sum(clusters[i]) / len(clusters[i])
            # If a cluster is empty, re-initialize it?
            # For this simple script, we'll leave it as is.

    return centroids, clusters

def save_results(analysis_data, centroids, clusters, sorted_centroids):
    results = {
        "analysis": analysis_data,
        "centroids": centroids,
        "cluster_stats": []
    }

    labels = ["Low Complexity", "Medium Complexity", "High Complexity"]

    # Map cluster index to label based on sorted centroid value
    # sorted_centroids is list of (original_index, value)
    # We want to know: Cluster 0 is "Low" or "High"?
    # If sorted_centroids[0] is (1, val), it means Cluster 1 has the lowest value.

    # Let's rebuild the mapping to be clearer
    # We want to save which image belongs to which "Label"

    # 1. Assign a label to each centroid index
    centroid_label_map = {} # index -> label
    for rank, (c_idx, c_val) in enumerate(sorted_centroids):
        centroid_label_map[c_idx] = labels[rank]

    # 2. Assign each image to a label
    for item in analysis_data:
        val = item["energy"]
        # Find closest centroid
        dists = [abs(val - c) for c in centroids]
        min_dist_idx = dists.index(min(dists))
        item["cluster_index"] = min_dist_idx
        item["label"] = centroid_label_map[min_dist_idx]

    # 3. Stats
    for rank, (c_idx, c_val) in enumerate(sorted_centroids):
        count = len(clusters[c_idx])
        results["cluster_stats"].append({
            "label": labels[rank],
            "centroid": c_val,
            "count": count,
            "cluster_index": c_idx
        })

    out_path = os.path.join(DATA_DIR, "analysis_results.json")
    with open(out_path, 'w') as f:
        json.dump(results, f, indent=2)

    return results

def generate_report(results):
    report_path = os.path.join("tools/canvasml", "report.md")

    stats = results["cluster_stats"]
    analysis = results["analysis"]

    # Sort analysis by energy descending (most complex first)
    sorted_analysis = sorted(analysis, key=lambda x: x["energy"], reverse=True)

    with open(report_path, 'w') as f:
        f.write("# CanvasML Vision Analysis Report\n\n")
        f.write("## Overview\n\n")
        f.write("The **CanvasML Vision** pipeline has processed the captured variations. ")
        f.write("Using a custom Convolutional Neural Network (Sobel filters) and K-Means clustering, ")
        f.write("we have categorized the visual states based on their 'Edge Energy' (Complexity).\n\n")

        f.write("## Cluster Analysis\n\n")
        f.write("| Complexity Label | Centroid Energy | Image Count |\n")
        f.write("| :--- | :--- | :--- |\n")
        for stat in stats:
            f.write(f"| **{stat['label']}** | {stat['centroid']:.2f} | {stat['count']} |\n")

        f.write("\n## The Judgment\n\n")

        # Identify extremes
        most_complex = sorted_analysis[0]
        least_complex = sorted_analysis[-1]

        f.write(f"**Most Chaotic Visualization:** Variation #{most_complex['id']} ")
        f.write(f"(Energy: {most_complex['energy']:.2f})\n")
        f.write(f"- *Verdict:* Potential clutter. Verify if elements are overlapping.\n\n")

        f.write(f"**Most Minimalist Visualization:** Variation #{least_complex['id']} ")
        f.write(f"(Energy: {least_complex['energy']:.2f})\n")
        f.write(f"- *Verdict:* Clean, potentially sparse. Ensure all required elements are present.\n\n")

        f.write("## Detailed Data (Top 5 Highest Energy)\n\n")
        f.write("| ID | Energy | Cluster |\n")
        f.write("| :--- | :--- | :--- |\n")
        for item in sorted_analysis[:5]:
            f.write(f"| {item['id']} | {item['energy']:.2f} | {item['label']} |\n")

    print(f"Report generated at {report_path}")

def main():
    print("Starting CanvasML Vision Analysis...")
    analysis_data = [] # List of dicts {id, energy}
    features = [] # List of energy values for kmeans

    for i in range(50):
        pixels = load_capture(i)
        if not pixels:
            continue

        gray = to_grayscale(pixels)
        edges = convolve_sobel(gray, WIDTH, HEIGHT)
        energy = analyze_features(edges)

        analysis_data.append({"id": i, "energy": energy})
        features.append(energy)

        if i % 10 == 0:
            print(f"Processed image {i}, Energy: {energy:.2f}")

    if not features:
        print("No data found.")
        return

    print("\nClustering Visual States (Clutter Analysis)...")
    centroids, clusters = simple_kmeans(features)

    # Sort centroids to determine Low/Med/High
    # sorted_centroids is list of (index, value)
    sorted_centroids = sorted(list(enumerate(centroids)), key=lambda x: x[1])

    print("\nResults:")
    labels = ["Low Complexity", "Medium Complexity", "High Complexity"]
    for i in range(3):
        c_idx, c_val = sorted_centroids[i]
        count = len(clusters[c_idx])
        print(f"Cluster '{labels[i]}' (Centroid: {c_val:.2f}): {count} images")

    # Save and Report
    print("\nGenerating Report...")
    results = save_results(analysis_data, centroids, clusters, sorted_centroids)
    generate_report(results)

if __name__ == "__main__":
    main()

import json
import os
import math
import sys
# Add parent directory to path to find canvas_ml package if run directly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from canvas_ml import model

DATA_DIR = "tools/canvas_ml/data"
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

def calculate_symmetry(gray_pixels, width, height):
    """
    Calculates bilateral symmetry score (0.0 to 1.0).
    Compares left half to mirrored right half.
    """
    diff = 0
    total = 0
    mid_x = width // 2

    for y in range(height):
        for x in range(mid_x):
            left_idx = y * width + x
            right_idx = y * width + (width - 1 - x)

            p_left = gray_pixels[left_idx]
            p_right = gray_pixels[right_idx]

            diff += abs(p_left - p_right)
            total += max(p_left, p_right) # Normalize by max potential difference (approx)

    if total == 0:
        return 1.0 # Blank image is symmetrical

    # Similarity = 1 - (diff / (max_diff))
    # Heuristic normalization
    # If perfect symmetry, diff is 0 -> score 1.

    score = 1.0 - (diff / (total + 1)) # +1 to avoid div zero
    return score

def calculate_balance(gray_pixels, width, height):
    """
    Calculates visual balance (0.0 to 1.0).
    Distance of Center of Mass (lightness) from geometric center.
    """
    total_mass = 0
    mom_x = 0
    mom_y = 0

    center_x = width / 2
    center_y = height / 2

    for y in range(height):
        for x in range(width):
            val = 255 - gray_pixels[y * width + x] # Invert so dark (ink) is mass
            if val < 0: val = 0 # Safety

            total_mass += val
            mom_x += x * val
            mom_y += y * val

    if total_mass == 0:
        return 1.0 # Empty is balanced

    com_x = mom_x / total_mass
    com_y = mom_y / total_mass

    # Distance from center
    dist = math.sqrt((com_x - center_x)**2 + (com_y - center_y)**2)
    max_dist = math.sqrt(center_x**2 + center_y**2)

    balance_score = 1.0 - (dist / max_dist)
    return max(0.0, balance_score)

def calculate_calm_score(energy, symmetry, balance):
    """
    Combines metrics into a 'Calm Score' (0-100).
    High Symmetry + High Balance + Low Energy = High Calm.
    """
    # Normalize Energy (Assuming typical max around 300k based on previous reports)
    # Energy is 'Clutter', so we want inverse.
    norm_energy = min(energy / 350000.0, 1.0)
    energy_score = 1.0 - norm_energy

    # Weighted sum
    # Symmetry: 30%, Balance: 20%, Low Energy: 50%
    calm = (0.3 * symmetry) + (0.2 * balance) + (0.5 * energy_score)
    return calm * 100

def save_results(analysis_data, centroids, clusters, sorted_centroids):
    results = {
        "analysis": analysis_data,
        "centroids": centroids,
        "cluster_stats": []
    }

    labels = ["Low Complexity", "Medium Complexity", "High Complexity"]

    # Map cluster index to label based on sorted centroid value
    centroid_label_map = {} # index -> label
    for rank, (c_idx, c_val) in enumerate(sorted_centroids):
        centroid_label_map[c_idx] = labels[rank]

    # Assign each image to a label
    for item in analysis_data:
        val = item["energy"]
        # Find closest centroid
        dists = [abs(val - c) for c in centroids]
        min_dist_idx = dists.index(min(dists))
        item["cluster_index"] = min_dist_idx
        item["label"] = centroid_label_map[min_dist_idx]

    # Stats
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
    report_path = os.path.join("tools/canvas_ml", "report.md")

    stats = results["cluster_stats"]
    analysis = results["analysis"]

    # Sort analysis by energy descending (most complex first)
    sorted_analysis = sorted(analysis, key=lambda x: x["energy"], reverse=True)

    # Sort by Calm Score (descending)
    sorted_calm = sorted(analysis, key=lambda x: x["calm_score"], reverse=True)

    with open(report_path, 'w') as f:
        f.write("# CanvasML Vision Analysis Report\n\n")
        f.write("## Overview\n\n")
        f.write("The **CanvasML Vision** pipeline has processed the captured variations. ")
        f.write("Using a custom Convolutional Neural Network (Sobel filters) and K-Means clustering, ")
        f.write("we have categorized the visual states based on their 'Edge Energy' (Complexity).\n")
        f.write("We have also introduced a **Calm Score** based on Symmetry, Balance, and low Visual Clutter.\n\n")

        f.write("## Cluster Analysis (Complexity)\n\n")
        f.write("| Complexity Label | Centroid Energy | Image Count |\n")
        f.write("| :--- | :--- | :--- |\n")
        for stat in stats:
            f.write(f"| **{stat['label']}** | {stat['centroid']:.2f} | {stat['count']} |\n")

        f.write("\n## The Judgment\n\n")

        # Identify extremes
        most_complex = sorted_analysis[0]
        least_complex = sorted_analysis[-1]

        most_calm = sorted_calm[0]
        least_calm = sorted_calm[-1]

        f.write(f"**Most Chaotic Visualization:** Variation #{most_complex['id']} ")
        f.write(f"(Energy: {most_complex['energy']:.2f})\n")
        f.write(f"- *Verdict:* Potential clutter.\n\n")

        f.write(f"**Most Minimalist Visualization:** Variation #{least_complex['id']} ")
        f.write(f"(Energy: {least_complex['energy']:.2f})\n")
        f.write(f"- *Verdict:* Clean, potentially sparse.\n\n")

        f.write(f"**Calmest Visualization:** Variation #{most_calm['id']} ")
        f.write(f"(Calm Score: {most_calm['calm_score']:.1f}/100)\n")
        f.write(f"- *Metrics:* Symmetry: {most_calm['symmetry']:.2f}, Balance: {most_calm['balance']:.2f}\n\n")

        f.write("## Detailed Data (Top 5 Highest Energy)\n\n")
        f.write("| ID | Energy | Cluster | Calm Score |\n")
        f.write("| :--- | :--- | :--- | :--- |\n")
        for item in sorted_analysis[:5]:
            f.write(f"| {item['id']} | {item['energy']:.2f} | {item['label']} | {item['calm_score']:.1f} |\n")

        f.write("\n## Detailed Data (Top 5 Calmest)\n\n")
        f.write("| ID | Calm Score | Symmetry | Balance | Energy |\n")
        f.write("| :--- | :--- | :--- | :--- | :--- |\n")
        for item in sorted_calm[:5]:
            f.write(f"| {item['id']} | {item['calm_score']:.1f} | {item['symmetry']:.2f} | {item['balance']:.2f} | {item['energy']:.2f} |\n")


    print(f"Report generated at {report_path}")

def analyze():
    print("Starting CanvasML Vision Analysis...")
    analysis_data = [] # List of dicts {id, energy}
    features = [] # List of energy values for kmeans

    for i in range(50):
        pixels = load_capture(i)
        if not pixels:
            continue

        gray = to_grayscale(pixels)
        edges = convolve_sobel(gray, WIDTH, HEIGHT)

        # Metrics
        energy = analyze_features(edges)
        symmetry = calculate_symmetry(gray, WIDTH, HEIGHT)
        balance = calculate_balance(gray, WIDTH, HEIGHT)
        calm = calculate_calm_score(energy, symmetry, balance)

        analysis_data.append({
            "id": i,
            "energy": energy,
            "symmetry": symmetry,
            "balance": balance,
            "calm_score": calm
        })
        features.append([energy]) # KMeans expects vectors

        if i % 10 == 0:
            print(f"Processed image {i}, Energy: {energy:.2f}, Calm: {calm:.1f}")

    if not features:
        print("No data found.")
        return

    print("\nClustering Visual States (Clutter Analysis)...")
    
    # Use shared KMeans model
    kmeans = model.KMeans(k=3)
    kmeans.fit(features)
    
    # Extract centroids (they are 1D vectors [energy])
    centroids = [c[0] for c in kmeans.centroids]
    
    # Reconstruct clusters for stats
    clusters = [[] for _ in range(3)]
    for f in features:
        val = f[0]
        c_idx = kmeans.predict([val])
        clusters[c_idx].append(val)

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
    analyze()

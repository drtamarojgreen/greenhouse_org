# CanvasML Vision Analysis Report

## Overview

The **CanvasML Vision** pipeline has processed the captured variations. Using a custom Convolutional Neural Network (Sobel filters) and K-Means clustering, we have categorized the visual states based on their 'Edge Energy' (Complexity).

## Cluster Analysis

| Complexity Label | Centroid Energy | Image Count |
| :--- | :--- | :--- |
| **Low Complexity** | 235940.32 | 4 |
| **Medium Complexity** | 247424.85 | 16 |
| **High Complexity** | 256363.51 | 17 |

## The Judgment

**Most Chaotic Visualization:** Variation #27 (Energy: 262414.42)
- *Verdict:* Potential clutter. Verify if elements are overlapping.

**Most Minimalist Visualization:** Variation #2 (Energy: 233745.45)
- *Verdict:* Clean, potentially sparse. Ensure all required elements are present.

## Detailed Data (Top 5 Highest Energy)

| ID | Energy | Cluster |
| :--- | :--- | :--- |
| 27 | 262414.42 | High Complexity |
| 21 | 259620.53 | High Complexity |
| 11 | 258031.69 | High Complexity |
| 34 | 257800.50 | High Complexity |
| 19 | 257363.45 | High Complexity |

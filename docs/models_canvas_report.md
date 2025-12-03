# CanvasML Vision Analysis Report

## Overview

The **CanvasML Vision** pipeline has processed the captured variations. Using a custom Convolutional Neural Network (Sobel filters) and K-Means clustering, we have categorized the visual states based on their 'Edge Energy' (Complexity).

## Cluster Analysis

| Complexity Label | Centroid Energy | Image Count |
| :--- | :--- | :--- |
| **Low Complexity** | 243851.44 | 31 |
| **Medium Complexity** | 264354.97 | 17 |
| **High Complexity** | 361429.61 | 2 |

## The Judgment

**Most Chaotic Visualization:** Variation #14 (Energy: 400881.29)
- *Verdict:* Potential clutter. Verify if elements are overlapping.

**Most Minimalist Visualization:** Variation #15 (Energy: 228345.16)
- *Verdict:* Clean, potentially sparse. Ensure all required elements are present.

## Detailed Data (Top 5 Highest Energy)

| ID | Energy | Cluster |
| :--- | :--- | :--- |
| 14 | 400881.29 | High Complexity |
| 11 | 321977.92 | High Complexity |
| 20 | 277019.99 | Medium Complexity |
| 41 | 273872.39 | Medium Complexity |
| 2 | 269985.70 | Medium Complexity |

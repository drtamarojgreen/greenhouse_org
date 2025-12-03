# CanvasML Vision Analysis Report

## Overview

The **CanvasML Vision** pipeline has processed the captured variations. Using a custom Convolutional Neural Network (Sobel filters) and K-Means clustering, we have categorized the visual states based on their 'Edge Energy' (Complexity).

## Cluster Analysis

| Complexity Label | Centroid Energy | Image Count |
| :--- | :--- | :--- |
| **Low Complexity** | 236547.79 | 8 |
| **Medium Complexity** | 248996.35 | 24 |
| **High Complexity** | 258353.58 | 18 |

## The Judgment

**Most Chaotic Visualization:** Variation #41 (Energy: 265485.78)
- *Verdict:* Potential clutter. Verify if elements are overlapping.

**Most Minimalist Visualization:** Variation #39 (Energy: 223015.38)
- *Verdict:* Clean, potentially sparse. Ensure all required elements are present.

## Detailed Data (Top 5 Highest Energy)

| ID | Energy | Cluster |
| :--- | :--- | :--- |
| 41 | 265485.78 | High Complexity |
| 27 | 265099.18 | High Complexity |
| 48 | 263824.39 | High Complexity |
| 47 | 262991.53 | High Complexity |
| 26 | 260543.25 | High Complexity |

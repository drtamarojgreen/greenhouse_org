# CanvasML Vision Analysis Report

## Overview

The **CanvasML Vision** pipeline has processed the captured variations. Using a custom Convolutional Neural Network (Sobel filters) and K-Means clustering, we have categorized the visual states based on their 'Edge Energy' (Complexity).

## Cluster Analysis

| Complexity Label | Centroid Energy | Image Count |
| :--- | :--- | :--- |
| **Low Complexity** | 179040.84 | 12 |
| **Medium Complexity** | 188864.75 | 16 |
| **High Complexity** | 199619.20 | 22 |

## The Judgment

**Most Chaotic Visualization:** Variation #47 (Energy: 211699.05)
- *Verdict:* Potential clutter. Verify if elements are overlapping.

**Most Minimalist Visualization:** Variation #39 (Energy: 164421.01)
- *Verdict:* Clean, potentially sparse. Ensure all required elements are present.

## Detailed Data (Top 5 Highest Energy)

| ID | Energy | Cluster |
| :--- | :--- | :--- |
| 47 | 211699.05 | High Complexity |
| 41 | 207983.49 | High Complexity |
| 27 | 206450.81 | High Complexity |
| 13 | 204955.03 | High Complexity |
| 16 | 203452.11 | High Complexity |

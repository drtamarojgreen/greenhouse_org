# CanvasML Vision Analysis Report

## Overview

The **CanvasML Vision** pipeline has processed the captured variations. Using a custom Convolutional Neural Network (Sobel filters) and K-Means clustering, we have categorized the visual states based on their 'Edge Energy' (Complexity).

## Cluster Analysis

| Complexity Label | Centroid Energy | Image Count |
| :--- | :--- | :--- |
| **Low Complexity** | 178523.89 | 16 |
| **Medium Complexity** | 180208.14 | 19 |
| **High Complexity** | 182229.96 | 14 |

## The Judgment

**Most Chaotic Visualization:** Variation #49 (Energy: 184618.56)
- *Verdict:* Potential clutter. Verify if elements are overlapping.

**Most Minimalist Visualization:** Variation #15 (Energy: 175988.43)
- *Verdict:* Clean, potentially sparse. Ensure all required elements are present.

## Detailed Data (Top 5 Highest Energy)

| ID | Energy | Cluster |
| :--- | :--- | :--- |
| 49 | 184618.56 | High Complexity |
| 3 | 183780.66 | High Complexity |
| 2 | 183213.60 | High Complexity |
| 17 | 182499.84 | High Complexity |
| 9 | 182192.85 | High Complexity |

# CanvasML Vision Analysis Report

## Overview

The **CanvasML Vision** pipeline has processed the captured variations. Using a custom Convolutional Neural Network (Sobel filters) and K-Means clustering, we have categorized the visual states based on their 'Edge Energy' (Complexity).
We have also introduced a **Calm Score** based on Symmetry, Balance, and low Visual Clutter.

## Cluster Analysis (Complexity)

| Complexity Label | Centroid Energy | Image Count |
| :--- | :--- | :--- |
| **Low Complexity** | 253602.22 | 18 |
| **Medium Complexity** | 271175.57 | 21 |
| **High Complexity** | 283469.88 | 11 |

## The Judgment

**Most Chaotic Visualization:** Variation #40 (Energy: 292902.31)
- *Verdict:* Potential clutter.

**Most Minimalist Visualization:** Variation #0 (Energy: 196998.01)
- *Verdict:* Clean, potentially sparse.

**Calmest Visualization:** Variation #0 (Calm Score: 69.4/100)
- *Metrics:* Symmetry: 0.96, Balance: 0.94

## Detailed Data (Top 5 Highest Energy)

| ID | Energy | Cluster | Calm Score |
| :--- | :--- | :--- | :--- |
| 40 | 292902.31 | High Complexity | 55.0 |
| 30 | 291783.95 | High Complexity | 55.3 |
| 33 | 284734.52 | High Complexity | 56.2 |
| 7 | 284331.38 | High Complexity | 56.4 |
| 5 | 282789.10 | High Complexity | 56.5 |

## Detailed Data (Top 5 Calmest)

| ID | Calm Score | Symmetry | Balance | Energy |
| :--- | :--- | :--- | :--- | :--- |
| 0 | 69.4 | 0.96 | 0.94 | 196998.01 |
| 34 | 61.9 | 0.93 | 0.95 | 245605.42 |
| 49 | 61.0 | 0.93 | 0.95 | 251350.25 |
| 13 | 60.9 | 0.93 | 0.96 | 253041.66 |
| 35 | 60.9 | 0.93 | 0.95 | 253076.99 |

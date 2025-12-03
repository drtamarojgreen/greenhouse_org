# CanvasML Pipeline Report

## Overview

The **CanvasML Vision** pipeline has processed 50 enhancements/variations. Using a custom Convolutional Neural Network (Sobel filters) and K-Means clustering, the visual states were categorized based on their 'Edge Energy' (Visual Complexity).
Additionally, a **Calm Score** was introduced to quantify visual tranquility, aggregating Bilateral Symmetry, Visual Balance (Center of Mass), and inverse Edge Energy.

## Cluster Analysis (Complexity)

| Complexity Label | Centroid Energy | Image Count |
| :--- | :--- | :--- |
| **Low Complexity** | 233267.26 | 6 |
| **Medium Complexity** | 248851.37 | 37 |
| **High Complexity** | 277556.52 | 7 |

## The Judgment

### Most Chaotic Visualization
**Variation #10 (Small Icons)**
- **Energy:** 295124.49 (High Complexity)
- **Calm Score:** 55.1/100
- **Assessment:** The reduction in icon scale created high-frequency edge noise, resulting in the highest energy and lowest calm score.

### Most Minimalist Visualization
**Variation #47 (Self-Reflection)**
- **Energy:** 227100.00 (Low Complexity)
- **Calm Score:** 65.1/100
- **Assessment:** Removing most elements left a single, centered focal point, maximizing both simplicity and balance.

### Calmest Visualization
**Variation #47 (Self-Reflection)**
- **Calm Score:** 65.1/100
- **Metrics:** Symmetry: 0.94 | Balance: 0.96 | Energy: 227k
- **Assessment:** This variation achieved the highest score by combining low clutter (Low Energy) with near-perfect centering (High Balance) and symmetry.

## Detailed Pipeline Assessment

This section details how the pipeline assesses specific enhancement categories based on the new metrics.

### 1. Symmetry and Balance (The "Calm" Factors)
The new **Calm Score** successfully differentiated variations that might have similar energy levels but different structural harmonies.
- **Support Network Radial (#32):** Scored high on Calm (63.4) despite moderate energy (238k). The radial arrangement created a high Symmetry score (0.94), proving that "complex" (many items) can still be "calm" if ordered.
- **Calm State (#41):** Paradoxically scored High Energy (294k) and relatively low Calm (55.2). This reveals a limitation in the current renderer/pipeline interaction: the specific "Calm" variation likely used overlapping or intricate icons that the Sobel filter interpreted as "noise". The Symmetry metric was not high enough to offset the massive Edge Energy penalty.

### 2. Density Stress Tests
- **Icon Heavy (#3) & Label Heavy (#4):** Both correctly fell into **High Complexity** with low Calm scores (< 59). The pipeline accurately identifies that adding more distinct elements increases visual load.
- **Small Icons (#10):** Scored *higher* energy than "Icon Heavy". This suggests the pipeline is sensitive to the "grain" of the image; many small, sharp edges generate more total gradient magnitude than fewer large edges.

### 3. Accessibility & Color
- **Accessibility Modes (#26-28):** These variations clustered in **Medium Complexity** with average Calm scores (~61-62). This confirms that changing color palettes (Deuteranopia, etc.) does not significantly disrupt visual balance or complexity, ensuring these accessible modes remain as "calm" as the baseline.
- **High Contrast (#18):** Scored similarly to baseline, indicating the Sobel filter is detecting edges regardless of the specific color values, as long as contrast exists.

### 4. Layout Metaphors
- **Grid Layout (#15):** High Energy (267k) but moderate Calm (59.2). The grid structure provided some Symmetry, but the sheer number of aligned edges contributed to the complexity score.
- **Growth Spiral (#33):** Lower Calm score than Radial. Spirals are inherently asymmetrical (bilaterally), which the current Symmetry metric (Left vs Right) penalizes compared to perfect circles or grids.

## Conclusion

The introduction of the **Calm Score** provides a multi-dimensional view of the canvas. While **Edge Energy** detects raw clutter, **Symmetry and Balance** help identify *ordered* complexity. The analysis highlights that:
1.  **Order reduces perceived chaos:** Radial and Central layouts score better on Calm than scattered ones of similar density.
2.  **Scale matters:** Smaller elements can paradoxically increase "noise" (Energy) more than larger ones.
3.  **Symmetry Bias:** The current metric favors bilateral symmetry; future iterations could include radial symmetry detection to better score spiral or circular arrangements.
# Canvas Model Report

## Pipeline Results

This report summarizes the results of testing 25 visual enhancements for the Greenhouse Mental Health models using the `canvas_ml` pipeline.

### Overview

The pipeline assessed each enhancement for:
-   **Render Performance**: Change in rendering duration.
-   **Visual Impact**: Change in visual complexity/value score.
-   **Stability**: Whether the mutation could be applied and rendered successfully.

### Enhancement Summary

| Enhancement | Improvement Category | Render Change (s) | Score Change | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Brain: Rainbow Activation** | Performance Win | -1.17s | +11.71 | Significant visual value increase with performance gain. |
| **Brain: Hexagonal Grid** | - | - | - | Mutation failed to apply (pattern not found). |
| **Brain: Neon Mode** | Performance Win | -10.96s | +109.52 | Massive score increase and performance gain. (Likely an anomaly or radical simplification). |
| **Brain: Starry Background** | Regression | +0.44s | -4.39 | Added rendering cost for negative visual value. |
| **Brain: Pulse Wave** | - | - | - | Mutation failed to apply. |
| **Brain: Node Halos** | Performance Win | -0.55s | +5.58 | Good visual enhancement with improved performance. |
| **Synapse: Bouncing Particles** | Neutral | +0.03s | -0.42 | Minimal impact. |
| **Synapse: Trail Effect** | Neutral | -0.03s | +0.32 | Minimal impact. |
| **Synapse: Receptor Blink** | - | - | - | Mutation failed to apply. |
| **Synapse: Gradient Background** | Regression | +0.14s | -1.32 | Slight performance hit. |
| **Synapse: Particle Explosion** | Performance Win | -0.22s | +2.25 | Improved performance and score. |
| **Synapse: Vesicle Wobble** | Regression | +0.22s | -2.26 | Performance hit. |
| **Synapse: ZigZag Path** | Neutral | -0.00s | +0.04 | No measurable impact. |
| **Environment: Day/Night Cycle** | Performance Win | -0.23s | +2.18 | Efficient visual upgrade. |
| **Environment: Rain Effect** | Regression | +0.36s | -3.46 | Performance cost. |
| **Environment: Clouds** | Performance Win | -0.15s | +1.42 | Efficient visual upgrade. |
| **Environment: Grass Texture** | Performance Win | -0.12s | +1.36 | Efficient visual upgrade. |
| **Environment: Sun Rays** | Performance Win | -0.09s | -0.11 | Performance gain but slight score drop. |
| **Environment: Icon Bobbing** | Regression | +0.11s | -0.21 | Slight regression. |
| **Environment: Vignette** | Regression | +0.06s | +7.01 | High visual impact but slight cost. |
| **Environment: Sepia Tone** | Regression | +0.15s | -2.98 | Performance cost. |
| **Environment: Glitch Effect** | Regression/Perf Win* | -0.40s | -3.52 | Faster but lower score (Mixed results). |
| **Environment: Spotlight** | Regression | +0.22s | +11.17 | High visual impact with performance cost. |
| **Environment: Paper Texture** | Regression | +0.05s | -12.49 | Negative score impact (likely too much noise). |
| **Environment: Blueprint Mode** | - | - | - | Mutation failed to apply. |

### Top Recommendations

Based on the pipeline analysis, the following enhancements are recommended for immediate implementation:

1.  **Brain: Neon Mode**: Shows exceptional metrics, though visual verification is needed to ensure it fits the design language.
2.  **Brain: Rainbow Activation**: Strong positive impact on both metrics.
3.  **Brain: Node Halos**: Good balance of visual interest and performance.
4.  **Environment: Day/Night Cycle**: Adds dynamism with minimal cost.
5.  **Synapse: Particle Explosion**: Improves the dynamic feel of the synapse model efficiently.

### Anomalies

-   **Neon Mode** resulted in a surprisingly large performance gain (-10.96s). This warrants investigation as it might indicate the "enhancement" inadvertently disabled a costly rendering step or the baseline was high.
-   Several "Performance Wins" were observed even when adding complexity. This might be due to run-to-run variance in the browser environment or the mutations simplifying the underlying canvas paths.

### Conclusion

The `canvas_ml` pipeline successfully identified viable enhancements. The "Performance Win" category suggests that many visual improvements can be made without sacrificing (and potentially improving) rendering times.

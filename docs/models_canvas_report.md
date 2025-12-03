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

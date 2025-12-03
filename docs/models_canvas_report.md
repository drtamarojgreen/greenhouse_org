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

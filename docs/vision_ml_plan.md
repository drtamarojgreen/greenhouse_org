# Vision ML Pipeline Development Plan

## Overview

This document outlines the roadmap for developing, enhancing, and automated the Vision ML pipeline for the Greenhouse for Mental Health Development. The pipeline is designed to evaluate visual improvements to the Environments, Brain, and Synapse canvases using a lightweight, Python-based Machine Learning approach.

## 1. Development Roadmap

### Phase 1: Prototype (Current)
- **Goal:** Establish a working baseline for rendering, feature extraction, and simple clustering.
- **Components:**
  - `renderer.py`: Playwright-based capture of pixel data and performance metrics.
  - `cnn_layer.py`: Manual implementation of basic convolution and pooling.
  - `scorers.py`: Visual metrics (Contrast, White Space, Color Entropy).
  - `model.py`: Manual K-Means clustering.
  - `pipeline.py`: Orchestration.

### Phase 2: Refinement & Validation
- **Goal:** Calibrate the scorers and models against real-world data.
- **Actions:**
  - Collect a dataset of "good" and "bad" canvas states (snapshots).
  - Tune the weights in the `predict_value` heuristic.
  - Optimize the Python implementations of CNN and K-Means for speed (e.g., using `struct` or optimized list comprehensions if `numpy` remains forbidden).

### Phase 3: Integration
- **Goal:** Connect the pipeline to the development workflow.
- **Actions:**
  - Create a CLI entry point for developers to run local checks.
  - Integrate with the CI/CD pipeline (see Automation).

## 2. Enhancement Strategies

### Advanced Feature Extraction
- **Current:** Basic Edge Detection (3x3 Sobel-like kernels).
- **Future:**
  - Implement additional kernels for texture analysis (e.g., Gabor filters).
  - Implement a multi-layer CNN (if performance permits) to detect higher-level shapes (nodes, connections).

### Human-in-the-Loop Training
- **Concept:** Allow developers to "vote" on the cluster assignments or value predictions.
- **Mechanism:**
  - The pipeline generates a report.
  - Developers flag "False Positives" (e.g., a "cluttered" design that is actually high-density information).
  - Feed these flags back into the system to adjust cluster centroids or scoring weights.

### Expanded Metrics
- **Accessibility:**
  - Strict WCAG 2.1 AA contrast checking on the pixel data.
  - Color blindness simulation (protanopia, deuteranopia) before analysis to ensure visual distinctiveness holds.
- **Performance:**
  - Frame Rate (FPS) analysis: Capture a short video/trace instead of a static screenshot to measure animation smoothness.

## 3. Automation Strategy

### CI/CD Integration
- **Trigger:** Pull Requests targeting the `frontend` application.
- **Action:**
  - Spin up a temporary preview environment.
  - Run the `tools/canvas_ml/pipeline.py` against the preview URLs.
  - Compare the scores/clusters against the `main` branch baseline.
  - Post a comment on the PR with the "Visual Impact Report" (Regression/Improvement).

### Continuous Benchmarking (Cron)
- **Schedule:** Nightly.
- **Action:**
  - Run the full pipeline on a set of critical user journeys.
  - Store the vectors in a time-series database.
  - Alert the team if a "drift" in visual complexity or render time is detected over time.

### Artifact Management
- Do not Store the generated screenshots and feature maps, export a csv with columns render_change, total_score

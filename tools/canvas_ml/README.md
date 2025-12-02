# CanvasML Pipeline

This directory contains the CanvasML pipeline, a computer vision system designed to generate, capture, and analyze visual variations of the Greenhouse environment.

## Overview

The pipeline consists of three main stages:
1.  **Generation**: Creating synthetic configuration variations.
2.  **Harvesting**: Capturing screenshots and pixel data from the running application.
3.  **Vision**: Analyzing the captured data using Sobel filters and K-Means clustering to categorize visual complexity.

## Prerequisites

-   Python 3.x
-   Playwright (with Chromium installed)
-   Headless Chromium requires `--use-gl=egl` for WebGL support (handled automatically by the scripts).

To install dependencies:
```bash
pip install playwright
playwright install chromium
```

## Usage

The pipeline scripts are designed to be run in sequence.

### 1. Start the Local Server
The harvester needs to access the application via HTTP. Start a simple server at the repository root:

```bash
python3 -m http.server 8000 &
```

### 2. Generate Variations
Generate synthetic configuration files (JSON) in `tools/canvas_ml/data/`.

```bash
python3 tools/canvas_ml/generator.py
```
*Output: `variation_*.json` files.*

### 3. Harvest Data
Launch Headless Chromium to load each variation and capture the canvas state.

```bash
python3 tools/canvas_ml/harvester.py
```
*Output: `capture_*.json` (pixel data) and `screenshot_*.png`.*

### 4. Run Vision Analysis
Process the captured pixel data to calculate edge energy and cluster the results.

```bash
python3 tools/canvas_ml/vision.py
```
*Output: `tools/canvas_ml/report.md` and console analysis.*

## Output

The final report `tools/canvas_ml/report.md` contains:
-   Cluster analysis (Low, Medium, High Complexity).
-   Identification of the most chaotic and minimalist visualizations.
-   Detailed energy metrics for the top complex variations.

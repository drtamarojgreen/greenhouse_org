# CanvasML Pipeline

This directory contains a computer vision pipeline for generating, harvesting, and analyzing synthetic canvas states from the Greenhouse Models application.

## Components

1.  **`generator.py`**: Generates synthetic configuration data (`variation_*.json`) for the environment.
2.  **`harvester.py`**: Uses Playwright to load the application with the generated configurations, capturing screenshots and raw pixel data.
3.  **`vision.py`**: Analyzes the captured pixel data using Sobel filters and K-Means clustering to categorize visual complexity.

## Usage

### 1. Start the Web Server
The harvester requires the application to be running locally on port 8000.
From the root of the repository:
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

### 2. Run the Pipeline
The scripts must be executed in the following order:

```bash
# 1. Generate synthetic data
python3 tools/canvas_ml/generator.py

# 2. Harvest data (screenshots and pixels)
# Note: Requires --use-gl=egl for headless rendering (already handled in script)
python3 tools/canvas_ml/harvester.py

# 3. Analyze data and generate report
python3 tools/canvas_ml/vision.py
```

### 3. Output
-   **Data**: All generated data is stored in `tools/canvas_ml/data/`.
-   **Report**: The final analysis report is generated at `tools/canvas_ml/report.md`.

## Development Utility

This pipeline is a critical tool for the development of the Models page rendering engine:

1.  **Visual Regression Testing**:
    -   By establishing a baseline "Energy" score, developers can verify that code changes (e.g., resizing icons, changing fonts) have the intended visual impact.
    -   A sudden drop to 0 Energy indicates a rendering failure (blank screen), which acts as an automated smoke test for the graphics engine.

2.  **Clutter Analysis (UI/UX Tuning)**:
    -   The "High Complexity" cluster identifies states that may be too "busy" or cluttered for users.
    -   The "Low Complexity" cluster identifies states that may look sparse or broken.
    -   Developers can use these metrics to tune the random generation algorithms, ensuring the user always sees a balanced and aesthetically pleasing composition.

3.  **Automated QA at Scale**:
    -   Instead of manually checking 50 different configurations, the pipeline automatically processes them.
    -   It ensures that edge cases (e.g., overlapping elements, rare icon combinations) do not cause crashes or rendering artifacts.
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

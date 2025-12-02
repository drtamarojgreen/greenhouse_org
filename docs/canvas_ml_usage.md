# CanvasML Pipeline Usage

This document outlines how to run the CanvasML computer vision pipeline for generating, capturing, and analyzing visual variations of the Greenhouse models.

## Components

The pipeline consists of three main stages:
1. **Generator** (`tools/canvas_ml/generator.py`): Creates synthetic configuration files (`variation_*.json`).
2. **Harvester** (`tools/canvas_ml/harvester.py`): Runs a headless browser to render the configurations and captures pixel data (`capture_*.json`).
3. **Vision** (`tools/canvas_ml/vision.py`): Analyzes the captured pixels using Computer Vision techniques (Sobel filters, K-Means) and generates a report (`report.md`).

There is also a single-shot `pipeline.py` for quick verification of a specific URL.

## Prerequisites

- Python 3
- Playwright (`pip install playwright` and `playwright install chromium`)
- A local HTTP server to serve the application.

## Running the Pipeline

### 1. Generate Data
Create the synthetic variation configurations:
```bash
python3 tools/canvas_ml/generator.py
```
This will populate `tools/canvas_ml/data/` with `variation_*.json` files.

### 2. Start Local Server
The harvester needs to access the application via HTTP. Start a simple server in the repository root:
```bash
python3 -m http.server 8000 &
```
*Note: Ensure port 8000 is free.*

### 3. Harvest Data
Run the harvester to capture screenshots and pixel data:
```bash
python3 tools/canvas_ml/harvester.py
```
This script will:
- Launch a headless Chromium browser.
- Iterate through the generated variations.
- Inject the configuration into the browser.
- Capture the rendered canvas to `tools/canvas_ml/data/capture_*.json`.

### 4. Analyze Results
Run the vision analysis script:
```bash
python3 tools/canvas_ml/vision.py
```
This will:
- Read the captured pixel data.
- Apply Sobel edge detection to calculate "Visual Energy" (complexity).
- Cluster the results using K-Means.
- Generate a report at `tools/canvas_ml/report.md`.

### 5. Cleanup
Don't forget to stop the background server:
```bash
kill %1
# or find the process id with `jobs` or `ps`
```

## Single-Shot Pipeline
To run a single capture and analysis on a specific URL (useful for testing):
```bash
python3 tools/canvas_ml/pipeline.py [URL]
```
If no URL is provided, it attempts to start a local server and test `docs/models.html`.

## Troubleshooting

- **Empty Captures**: If `vision.py` reports errors or clustering fails, check if `capture_*.json` files contain valid data (non-zero arrays).
- **Headless Rendering**: If captures are black/empty, ensure the environment supports headless WebGL. In some environments, `chromium.launch(headless=True, args=['--use-gl=egl'])` might be required in `renderer.py` and `harvester.py`.

## Verification Status

Verified that the pipeline functions correctly with standard `headless=True` configuration (no extra flags required) as of the latest run.

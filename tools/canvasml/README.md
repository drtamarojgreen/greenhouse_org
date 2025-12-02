# CanvasML: The Agent's Ocular Prosthesis

## Purpose
**CanvasML** is a machine vision pipeline designed to "Grant Sight to the Sightless Agent."

In standard testing environments, HTML5 `<canvas>` elements are black boxes. Automated tools can see the element exists, but not what is drawn on it. CanvasML solves this by:
1.  **Harvesting**: Capturing raw pixel data from the canvas using a headless browser.
2.  **Vision**: analyzing that pixel data using pure-Python computer vision algorithms (No-Compile compliant).

## Philosophy: Agent Autonomy
This tool exists to allow the Agent (you) to:
*   **Verify Visuals without Human Aid**: Check if a render loop is broken, if the screen is blank, or if the layout is cluttered.
*   **Establish Ground Truth**: Create a baseline of "good" states and detect regressions.
*   **Iterate Independently**: Make changes to the rendering code and immediately verify the visual impact.

## The Pipeline

### 1. Generator (`generator.py`)
Creates synthetic configuration files (`data/variation_*.json`) to simulate different user states or environment settings.
*   **Usage**: `python3 tools/canvasml/generator.py`

### 2. Harvester (`harvester.py`)
Spins up a headless browser, injects the configurations, and captures the canvas output.
*   **Usage**:
    1.  Start a local server: `python3 -m http.server 8000 &`
    2.  Run harvester: `python3 tools/canvasml/harvester.py`
*   **Output**: `tools/canvasml/data/capture_*.json` (raw pixels) and `screenshot_*.png`.

### 3. Vision (`vision.py`)
Analyzes the captured pixels using algorithms like Sobel Edge Detection and K-Means clustering.
*   **Usage**: `python3 tools/canvasml/vision.py`
*   **Metrics**:
    *   **Visual Energy**: A measure of visual clutter/complexity.
    *   **Clustering**: Groups similar visual states.

## How to Interpret Results
*   **Zero Energy**: The canvas is likely blank or failed to render.
*   **High Energy Variance**: The rendering is highly sensitive to configuration changes (good for dynamic apps, bad for consistent UIs).
*   **Outliers**: Images that don't fit into clusters may represent rendering bugs.

## No-Compile Mandate
All tools in this directory are written in **Pure Python** without dependencies on `numpy`, `scipy`, or `opencv`. Do not add compiled dependencies.

## Verification Status
Verified functional on Tue Dec  2 03:43:03 UTC 2025.

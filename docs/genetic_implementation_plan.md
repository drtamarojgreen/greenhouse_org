# Genetic Algorithm Visualization Implementation Plan

## Objective
Create a new page `/genetic/` (implemented as `docs/genetic.html`) to visualize genetic algorithms applied to brain development. This page will be similar to the existing `models` page but focused exclusively on a 3D demonstration of evolutionary processes in neural networks.

## Current State Analysis
*   **Existing 3D Engine**: The project uses a custom canvas-based 3D engine (`docs/js/models_3d_math.js` and `docs/js/models_ui_3d.js`). This is lightweight and sufficient for the task.
*   **Missing Logic**: The genetic algorithm logic (referenced in memory as `tools/genetic_ml`) is not present in the file system. We will need to implement a JavaScript-based genetic algorithm simulation specifically for this visualization.
*   **Wix Integration**: The current application (`models.html` / `models.js`) uses a specific pattern to run on Wix via script injection. The new page must adhere to this architecture to ensure seamless integration.

## Proposed File Structure

### 1. HTML Entry Point (`docs/genetic.html`)
*   **Base**: Cloned from `docs/models.html`.
*   **Modifications**:
    *   Remove 2D environment/graph canvases.
    *   Set the 3D canvas as the primary and only visualization.
    *   Update title and headers to "Genetic Brain Development".
    *   **Wix Compatibility**: Serve as a dev/test mock that mimics the Wix DOM structure.

### 2. Main Controller (`docs/js/genetic.js`)
*   **Purpose**: Orchestrate the page initialization and interaction, adhering to the Wix integration pattern.
*   **Key Responsibilities**:
    *   **Attribute Capture**: Read `data-base-url` and `data-target-selector` from the script tag.
    *   **Dependency Management**: Use `GreenhouseDependencyManager` (or fallback) to load `GreenhouseUtils` and other modules.
    *   **Resilience**: Expose a global `reinitialize()` method and implement `MutationObserver` logic to handle Wix's dynamic DOM (elements being removed/re-added).
    *   **Initialization**: Instantiate the Genetic Algorithm Logic and UI only after dependencies and DOM elements are ready.

### 3. Genetic Algorithm Logic (`docs/js/genetic_algo.js`)
*   **Purpose**: Simulate the evolution of neural networks.
*   **Key Concepts**:
    *   **Population**: A set of "Brain" objects (simplified networks).
    *   **Genotype**: Encoded as connection weights and topology.
    *   **Fitness Function**: Metric for network efficiency (e.g., signal propagation speed, connectivity density, or task performance).
    *   **Selection**: Tournament or Roulette wheel selection.
    *   **Crossover & Mutation**: Mechanisms to generate new offspring.
*   **Output**: The "fittest" brain of the current generation to be visualized.

### 4. 3D Visualization (`docs/js/genetic_ui_3d.js`)
*   **Base**: Adapted from `docs/js/models_ui_3d.js`.
*   **Modifications**:
    *   **Visualizing Change**: Instead of a static brain, animations should show connections growing/shrinking/moving as evolution progresses.
    *   **Generation Indicator**: Display current generation number in 3D space or overlay.
    *   **Fitness Visualization**: Color-code neurons or connections based on fitness contributions.
    *   **Genome View**: Optionally visualize the "DNA" (parameters) alongside the brain.
    *   **Wix Compatibility**: Ensure canvas resizing observes the container dimensions, which may change in the Wix environment.

## Implementation Steps

1.  **Scaffold Files**:
    *   Create `docs/genetic.html` based on `docs/models.html`.
    *   Create empty JS files: `docs/js/genetic.js`, `docs/js/genetic_algo.js`, `docs/js/genetic_ui_3d.js`.

2.  **Implement Genetic Logic (`docs/js/genetic_algo.js`)**:
    *   Define a `Network` class.
    *   Implement `evolve()` method.
    *   Implement `calculateFitness()` method.

3.  **Adapt 3D Visualization (`docs/js/genetic_ui_3d.js`)**:
    *   Refactor `GreenhouseModelsUI3D` to `GreenhouseGeneticUI3D`.
    *   Ensure it renders a `Network` object provided by the genetic algo.
    *   Add visual effects for mutation (e.g., flash on changed connections).

4.  **Wire It Up (`docs/js/genetic.js`)**:
    *   **Integration Layer**: Implement `captureScriptAttributes`, `loadDependencies`, and `main` function following `docs/js/models.js`.
    *   **Global Exposure**: Expose `window.GreenhouseGenetic` with `reinitialize` for Wix resilience.
    *   Initialize the loop: Evolve -> Update 3D Model -> Render -> Repeat.
    *   Bind UI controls to simulation parameters.

5.  **Testing & Verification**:
    *   Verify page load and layout in `docs/genetic.html`.
    *   Verify 3D rendering works (using `GreenhouseModels3DMath`).
    *   Verify evolution simulation runs and updates the display visually.
    *   **Integration Test**: Verify that the script mimics the loading behavior expected by Wix (checking console logs for dependency loading and attribute capture).

## Dependencies
*   `docs/js/models_3d_math.js` (Core 3D Math - Reuse)
*   `docs/js/GreenhouseUtils.js` (Utils - Reuse)
*   `docs/css/` (Existing styles - Reuse)

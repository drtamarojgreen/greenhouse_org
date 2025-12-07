# Neuro Implementation Plan

## Overview
This document outlines the plan for creating a new page `/neuro` on the website. This page will be dedicated to a 3D visualization of neuron growth demonstrated via a Genetic Algorithm (GA).

## Goals
1.  **Create `/neuro` Page**: A new HTML entry point (`docs/neuro.html`) that loads the necessary components for *local development*.
2.  **Implement Genetic Algorithm Simulation**: A JavaScript-based simulation (`docs/js/neuro_ga.js`) demonstrating network evolution.
3.  **3D Visualization**: Adapt existing 3D rendering logic (`models_ui_3d.js`) into `docs/js/neuro_ui_3d.js` to visualize this growth.
4.  **Wix Integration**: Ensure the new application can be embedded into the Wix-hosted production site.

## File Structure

### Frontend (GitHub Pages Assets)
These files are hosted on GitHub Pages and injected into the Wix site.
*   `docs/neuro.html`: **Local Development Mock.** A standalone HTML file to test the application outside of Wix. It will reside in the `docs/` root.
*   `docs/js/neuro_app.js`: **Main Application Entry Point.** Handles initialization, dependency loading, and mounting the application into the target DOM element.
*   `docs/js/neuro_ga.js`: **Simulation Logic.** Implements the Genetic Algorithm (population, fitness, evolution).
*   `docs/js/neuro_ui_3d.js`: **Visualization.** Handles the 3D rendering of the network.
*   `docs/js/greenhouse.js`: **Loader.** Needs update to route `/neuro` requests to `neuro_app.js`.

### Wix Application Structure (React/Velo)
These files reside in the `apps/` directory and represent the components used within the Wix environment (or the source of truth for Velo scripts).
*   `apps/frontend/neuro/Neuro.js`: **Wix/React Component.** This file serves as the interface or definition for the Neuro page component within the Wix application structure. It will likely handle the loading of the external `greenhouse.js` script or define the container where the app injects itself.

## Implementation Steps

### 1. Local Development Setup
*   Create `docs/neuro.html` containing a mock container element (e.g., `<div id="neuro-app-container"></div>`).
*   Create `docs/js/neuro_app.js` which:
    *   Accepts a target selector.
    *   Loads dependencies (`neuro_ga.js`, `neuro_ui_3d.js`).
    *   Initializes the app within the target container.

### 2. Genetic Algorithm (GA) Logic (`neuro_ga.js`)
*   Implement the "genome" (network weights/connections).
*   Implement the simulation loop.
*   Expose a state object for the UI to consume.

### 3. 3D Visualization (`neuro_ui_3d.js`)
*   Adapt `models_ui_3d.js` to read from the `neuro_ga.js` state.
*   Implement visual cues for growth.

### 4. Wix Integration Strategy
This is the critical path for production deployment.
*   **Wix Page Creation**: A new page (slug `/neuro`) must be created in the Wix editor.
*   **Greenhouse Loader Update**: Update `docs/js/greenhouse.js` to recognize the `/neuro` path and load `neuro_app.js`.
*   **App Component**: Create `apps/frontend/neuro/Neuro.js` to formalize the component in the codebase.

## Pre-Commit Steps
*   Complete pre commit steps (Ensuring no self-code review is performed and no text is saved to memory without consent).

## Submission
*   Request User Review.
*   Submit the changes.
